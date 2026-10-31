import { executeGroqStructuredQuery } from './groq-client';
import { fallbackRecommendProblems } from './fallback-engine';
import {
  ExistingCluster,
  ProblemRecommendationResult,
  RecommendedProblem,
  UserDiscoveryProfile,
} from './types';
import { z } from 'zod';

const RecommendationSchema = z.object({
  recommended_cluster_ids: z.array(
    z.object({
      cluster_id: z.string(),
      match_score: z.number().min(0).max(1),
      match_reasons: z.array(z.string()).min(1),
      suggested_contributions: z.array(z.string()).min(1),
    })
  ),
  overall_explanation: z.string(),
});

const CHATBOT_SYSTEM_PROMPT = `You are Solvyn's AI Problem Discovery Assistant.

Your goal is to match developers, builders, researchers, and innovators with real-world problems from Solvyn's verified database that best fit their skills and interests.

CRITICAL GROUNDING RULES:
1. ONLY RECOMMEND PROBLEMS THAT EXIST IN THE PROVIDED CANDIDATE LIST.
2. NEVER hallucinate or invent new cluster IDs, problem titles, or report statistics.
3. For each recommended problem, provide clear, personalized reasons explaining WHY the user's specific skills (e.g., React, Python, IoT, GIS) or interests (e.g., urban transit, healthcare, accessibility) make them an ideal solver.
4. Suggest concrete, practical contribution ideas for how they can begin tackling the issue.`;

/**
 * Solvyn Problem Discovery Assistant:
 * Recommends relevant real-world problems grounded strictly in actual database records.
 */
export async function recommendProblemsForUser(
  profile: UserDiscoveryProfile,
  availableProblems: ExistingCluster[]
): Promise<ProblemRecommendationResult> {
  if (!availableProblems || availableProblems.length === 0) {
    return {
      recommendations: [],
      total_available_searched: 0,
      explanation: 'No active problem clusters found in the database to recommend.',
      source: 'fallback',
    };
  }

  // Pre-filter to candidate problems (top 8)
  const candidateLookup = new Map<string, ExistingCluster>();
  for (const p of availableProblems) {
    candidateLookup.set(p.id, p);
  }

  const userPrompt = JSON.stringify({
    user_profile: {
      skills: profile.skills,
      interests: profile.interests,
      preferred_categories: profile.preferred_categories || [],
      query: profile.query || null,
    },
    available_problems: availableProblems.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      sub_problems: p.sub_problems || [],
      actual_report_count: p.report_count,
    })),
  });

  try {
    const { data } = await executeGroqStructuredQuery<any>({
      systemPrompt: CHATBOT_SYSTEM_PROMPT,
      userPrompt: `Match this user profile with the best problems from the available database list:\n${userPrompt}`,
      schema: RecommendationSchema,
      temperature: 0.2,
    });

    const recommendations: RecommendedProblem[] = [];

    for (const rec of data.recommended_cluster_ids) {
      const cluster = candidateLookup.get(rec.cluster_id);
      if (cluster) {
        recommendations.push({
          cluster_id: cluster.id,
          title: cluster.title, // Grounded in DB
          category: cluster.category,
          description: cluster.description,
          sub_problems: cluster.sub_problems || ['General issue'],
          actual_report_count: cluster.report_count, // Grounded in DB
          match_score: rec.match_score,
          match_reasons: rec.match_reasons,
          suggested_contributions: rec.suggested_contributions,
        });
      }
    }

    return {
      recommendations,
      total_available_searched: availableProblems.length,
      explanation: data.overall_explanation,
      source: 'ai',
    };
  } catch (error) {
    // Graceful fallback to deterministic recommendation matching
    const fallbackRecs = fallbackRecommendProblems(profile, availableProblems);
    return {
      recommendations: fallbackRecs,
      total_available_searched: availableProblems.length,
      explanation: `[AI Fallback Active] Matches identified using skill and domain keyword heuristics across ${availableProblems.length} database clusters.`,
      source: 'fallback',
    };
  }
}
