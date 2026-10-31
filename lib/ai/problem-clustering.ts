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
1. Hierarchical Clustering (Broad Problem Cluster vs. Specific Sub-Problem):
   - Multiple reports can belong to the SAME broader cluster while addressing DIFFERENT sub-problems!
   - Example A: "The BMTC app has a terrible interface."
   - Example B: "Navigating the BMTC app is very confusing."
     -> Both belong to the "BMTC Commuter Experience" cluster, with sub-problem: "UI/UX & App Navigation".
   - Example C: "I cannot track BMTC buses in real time."
   - Example D: "We need an app that shows live bus locations."
     -> Both belong to the "BMTC Commuter Experience" cluster, with sub-problem: "Real-time Bus Tracking".
   - Notice: Reports A & B share the UI/UX sub-problem. Reports C & D share the Live Tracking sub-problem. All four belong to the broader BMTC Commuter Experience cluster!

2. Decision Rules:
   - "MATCH_EXISTING": The new report clearly falls under the scope of one of the candidate clusters. Specify "matched_cluster_id" and identify the precise "sub_problem".
   - "NEW_CLUSTER": The report represents a genuinely different issue, different organization, or different infrastructure system not covered by any candidate.
   - "NEEDS_REVIEW": There is borderline or ambiguous similarity (confidence between 0.40 and 0.70), or conflicting domain overlap. Flag for human moderation rather than making a reckless automated merge.

3. Confidence Scoring:
   - 0.80 - 1.00: High confidence match or clear new cluster.
   - 0.50 - 0.79: Moderate/uncertain overlap -> Mark "NEEDS_REVIEW" and set "flagged_for_review": true.
   - 0.00 - 0.49: Low match with existing candidates -> Mark "NEW_CLUSTER".

4. Never merge reports from unrelated domains (e.g., Do NOT merge a hospital medicine shortage report into a bus transit cluster!).`;

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

