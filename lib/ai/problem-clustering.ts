import { executeGroqStructuredQuery } from './groq-client';
import { fallbackFindRelatedProblems, extractKeywordsFromText, inferCategoryFromText } from './fallback-engine';
import {
  ClusterMatchingResult,
  ClusterMatchingResultSchema,
  ExistingCluster,
  ProblemSubmissionInput,
} from './types';
import { getAIConfig } from './config';

const CLUSTERING_SYSTEM_PROMPT = `You are the lead AI problem clustering and deduplication engine for Solvyn.

Your job is to compare a new citizen problem report against a pre-filtered list of candidate problem clusters from the database.

CRITICAL CLUSTERING PRINCIPLES:
1. Core Problem Scope & Clustering Boundaries:
   - Sharing a category or broad domain is NOT sufficient for a match! (e.g., Two reports both in "Healthcare" or "Transportation" must remain separate if they describe different institutions, distinct facilities, or unrelated issues).
   - Reports must share a meaningful underlying problem context and common scope.
   - Different institutions, organizations, infrastructure systems, or unrelated root causes should remain separate clusters unless the supplied evidence establishes a genuine common parent problem.
   - Different sub-problems may share a parent cluster ONLY when that relationship is justified by a shared operational, institutional, or system-level context.

2. Hierarchical Clustering (Broad Problem Cluster vs. Specific Sub-Problem):
   - Multiple reports can belong to the SAME broader cluster while addressing DIFFERENT sub-problems!
   - Transit Domain Example:
     - Example A: "The BMTC app has a terrible interface."
     - Example B: "Navigating the BMTC app is very confusing."
       -> Both belong to the "BMTC Commuter Experience" cluster, with sub-problem: "UI/UX & App Navigation".
     - Example C: "I cannot track BMTC buses in real time."
     - Example D: "We need an app that shows live bus locations."
       -> Both belong to the "BMTC Commuter Experience" cluster, with sub-problem: "Real-time Bus Tracking".
     -> Notice: Reports A & B share the UI/UX sub-problem. Reports C & D share the Live Tracking sub-problem. All four belong to the broader BMTC Commuter Experience cluster because they share the same transit agency and mobile service ecosystem!
   - Healthcare Domain Example:
     - Example E: "Patients wait over 4 hours just to see an outpatient doctor for routine checkups."
       -> Belongs to "Government Hospital Service Bottlenecks", with sub-problem: "Outpatient Wait Times".
     - Example F: "The civil hospital pharmacy is completely out of stock of essential insulin and antibiotics."
       -> Belongs to "Government Hospital Service Bottlenecks", with sub-problem: "Essential Medicine Shortages".
     -> Notice: Both belong to the same broader hospital healthcare cluster because they describe service delivery at the same hospital network, while clearly distinguishing outpatient appointment delays from pharmacy supply stockouts!

3. Decision Rules:
   - "MATCH_EXISTING": The new report clearly falls under the scope of one of the candidate clusters. Specify "matched_cluster_id" and identify the precise "sub_problem".
   - "NEW_CLUSTER": The report represents a genuinely different issue, different organization, or different infrastructure system not covered by any candidate. Set "matched_cluster_id" and "matched_cluster_title" to null.
   - "NEEDS_REVIEW": There is borderline or ambiguous similarity (confidence between 0.50 and 0.74), or conflicting domain overlap. Flag for human moderation rather than making a reckless automated merge.

4. Confidence Scoring:
   - 0.75 - 1.00: High confidence match or clear new cluster ("flagged_for_review": false).
   - 0.50 - 0.74: Moderate/uncertain overlap -> Mark "NEEDS_REVIEW" and set "flagged_for_review": true.
   - 0.00 - 0.49: Low match with existing candidates -> Mark "NEW_CLUSTER" ("flagged_for_review": false).

5. Strict Domain & Institutional Isolation:
   - Never merge reports from unrelated domains (e.g., Do NOT merge a hospital medicine shortage report into a bus transit cluster!).
   - Never merge reports across separate institutions, agencies, or independent systems unless there is clear evidence of a unified parent cluster.

5. REQUIRED OUTPUT JSON SCHEMA:
You must respond ONLY with a valid JSON object. Do not enclose in markdown blocks, code fences, or add explanatory text outside the JSON.
The JSON object must use these EXACT property names:
- "match_decision": Must be exactly one of "MATCH_EXISTING", "NEW_CLUSTER", or "NEEDS_REVIEW". Never use "decision", "match", or other variations.
- "matched_cluster_id": The exact "id" string of the matched candidate cluster from candidate_clusters, or null if match_decision is "NEW_CLUSTER".
- "matched_cluster_title": The exact "title" string of the matched candidate cluster, or null if match_decision is "NEW_CLUSTER".
- "sub_problem": A concise string naming the specific sub-problem (e.g., "UI/UX & App Navigation", "Real-time Bus Tracking").
- "confidence": A float number between 0.0 and 1.0 indicating your confidence in this clustering decision.
- "reason": A string explaining why the report matches or differs from the candidates. Never use "explanation", "rationale", or "analysis".
- "flagged_for_review": A boolean (true or false). Must be true if match_decision is "NEEDS_REVIEW" or confidence is between 0.50 and 0.74; otherwise false.
- "candidate_similarity_scores": An object mapping each supplied candidate cluster "id" to a similarity float between 0.0 and 1.0.

Example of matching an existing cluster:
{
  "match_decision": "MATCH_EXISTING",
  "matched_cluster_id": "cluster-bmtc-101",
  "matched_cluster_title": "BMTC Commuter Experience Improvement",
  "sub_problem": "Real-time Bus Tracking",
  "confidence": 0.92,
  "reason": "The report specifically describes missing live bus tracking, which belongs to the BMTC commuter experience under the real-time bus tracking sub-problem.",
  "flagged_for_review": false,
  "candidate_similarity_scores": {
    "cluster-bmtc-101": 0.92
  }
}

Example of creating a new cluster:
{
  "match_decision": "NEW_CLUSTER",
  "matched_cluster_id": null,
  "matched_cluster_title": null,
  "sub_problem": "Primary Health Clinic Cold Storage",
  "confidence": 0.95,
  "reason": "The report describes rural clinic insulin refrigeration, which does not match any candidate transit clusters.",
  "flagged_for_review": false,
  "candidate_similarity_scores": {
    "cluster-bmtc-101": 0.05
  }
}`;

/**
 * Pre-filters and scores candidate clusters by category and keyword overlap
 * to ensure we send only the top 3-5 candidates to the LLM (never the whole database).
 */
export function prefilterCandidateClusters(
  newProblem: ProblemSubmissionInput,
  allCandidates: ExistingCluster[],
  limit = 5
): ExistingCluster[] {
  if (allCandidates.length <= limit) {
    return allCandidates;
  }

  const combinedText = `${newProblem.title || ''} ${newProblem.description}`.toLowerCase();
  const keywords = new Set(extractKeywordsFromText(combinedText));
  const category = inferCategoryFromText(combinedText);

  const scored = allCandidates.map((cluster) => {
    let score = 0;
    if (cluster.category.toLowerCase() === category.toLowerCase()) {
      score += 5;
    }
    const clusterTokens = [
      ...extractKeywordsFromText(cluster.title.toLowerCase()),
      ...extractKeywordsFromText(cluster.description.toLowerCase()),
      ...(cluster.keywords || []).map((k) => k.toLowerCase()),
    ];

    for (const token of clusterTokens) {
      if (keywords.has(token)) {
        score += 2;
      }
    }
    return { cluster, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.cluster);
}

/**
 * Compares a new problem report against candidate clusters from Supabase
 * and outputs matching decision, sub-problem grouping, and confidence score.
 */
export async function findRelatedProblems(
  newProblem: ProblemSubmissionInput,
  candidateClusters: ExistingCluster[]
): Promise<ClusterMatchingResult> {
  // If no candidate clusters exist in the database, it's definitely a new cluster
  if (!candidateClusters || candidateClusters.length === 0) {
    const combinedText = `${newProblem.title || ''} ${newProblem.description}`;
    const keywords = extractKeywordsFromText(combinedText);
    const subProblem = keywords.slice(0, 2).map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ') || 'General Issue';

    return {
      match_decision: 'NEW_CLUSTER',
      matched_cluster_id: null,
      matched_cluster_title: null,
      sub_problem: subProblem,
      confidence: 1.0,
      reason: 'No existing candidate clusters in database. Initializing new cluster.',
      flagged_for_review: false,
      source: 'ai',
      candidate_count: 0,
    };
  }

  // Pre-filter to top candidate clusters
  const topCandidates = prefilterCandidateClusters(newProblem, candidateClusters, 5);

  const userPrompt = JSON.stringify({
    new_report: {
      title: newProblem.title || null,
      description: newProblem.description,
      submitted_category: newProblem.submittedCategory || null,
    },
    candidate_clusters: topCandidates.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      description: c.description,
      existing_sub_problems: c.sub_problems || [],
      existing_keywords: c.keywords || [],
      report_count: c.report_count,
    })),
  });

  try {
    const { data, model } = await executeGroqStructuredQuery<any>({
      systemPrompt: CLUSTERING_SYSTEM_PROMPT,
      userPrompt: `Evaluate whether this new problem report matches any of the candidate clusters:\n${userPrompt}`,
      schema: ClusterMatchingResultSchema,
      temperature: 0.1,
    });

    const config = getAIConfig();
    const isUncertain =
      data.match_decision === 'NEEDS_REVIEW' ||
      (data.confidence < config.clusteringConfidenceThreshold &&
        data.confidence >= config.reviewConfidenceThreshold);

    const finalDecision = isUncertain ? 'NEEDS_REVIEW' : data.match_decision;
    const flagged = isUncertain || data.flagged_for_review;

    // Resolve matched cluster title if matched
    const matchedCluster = topCandidates.find((c) => c.id === data.matched_cluster_id);

    return {
      match_decision: finalDecision,
      matched_cluster_id: finalDecision === 'NEW_CLUSTER' ? null : data.matched_cluster_id,
      matched_cluster_title: matchedCluster ? matchedCluster.title : data.matched_cluster_title || null,
      sub_problem: data.sub_problem,
      confidence: data.confidence,
      reason: data.reason,
      flagged_for_review: flagged,
      candidate_similarity_scores: data.candidate_similarity_scores,
      source: 'ai',
      model_used: model,
      candidate_count: topCandidates.length,
    };
  } catch (error) {
    // Graceful fallback: Rule-based keyword/Jaccard overlap engine
    const fallback = fallbackFindRelatedProblems(newProblem, topCandidates);
    return {
      ...fallback,
      reason: `[AI Fallback Active - ${(error as Error).message}] ${fallback.reason}`,
    };
  }
}

