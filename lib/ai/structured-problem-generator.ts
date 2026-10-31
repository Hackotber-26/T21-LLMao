import { executeGroqStructuredQuery } from './groq-client';
import { fallbackGenerateStructuredProblem } from './fallback-engine';
import {
  ExistingCluster,
  IdentifiedSubProblemArea,
  ProblemReport,
  ProblemUrgency,
  StructuredProblemStatement,
  StructuredProblemStatementSchema,
} from './types';

const AGGREGATION_SYSTEM_PROMPT = `You are the lead AI problem aggregation synthesizer for Solvyn.

Your job is to synthesize multiple individual citizen problem reports belonging to a single problem cluster into an authoritative, structured, and actionable Problem Statement.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. NEVER INVENT STATISTICS. You must strictly use the provided actual report counts and percentage metrics.
2. Group the reports into coherent "identified_areas" (sub-problems) reflecting what users actually complained about.
3. For each identified area, write a clear 1-2 sentence description highlighting the pain points and include the exact provided report count and percentage.
4. Synthesize a professional, active "title" for the overarching problem (e.g. "BMTC Commuter Experience Improvement").
5. Write a comprehensive "description" synthesizing the common threads across all citizen reports.
6. Target users must reflect the affected demographics based on the reports.
7. Recommend 2 to 4 concrete engineering/civic "recommended_solution_focus" areas.`;

/**
 * Generates a structured aggregated problem statement from a cluster and its database reports.
 * Guarantees mathematical integrity of report counts and statistics.
 */
export async function generateStructuredProblem(
  cluster: ExistingCluster,
  reports: ProblemReport[]
): Promise<StructuredProblemStatement> {
  const totalReports = reports.length;

  if (totalReports === 0) {
    return {
      title: cluster.title,
      description: cluster.description || 'No citizen reports have been filed for this cluster yet.',
      category: cluster.category,
      identified_areas: [],
      target_users: ['General public'],
      urgency_breakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      total_reports: 0,
      recommended_solution_focus: ['Collect community feedback and reports.'],
      source: 'fallback',
      generated_at: new Date().toISOString(),
    };
  }

  // Calculate ground-truth statistics from actual reports
  const subProblemCounts = new Map<string, { count: number; samples: string[] }>();
  const urgencyCounts: Record<ProblemUrgency, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const targetUsersSet = new Set<string>();

  for (const report of reports) {
    const sp = report.sub_problem?.trim() || 'General Issue';
    const entry = subProblemCounts.get(sp) || { count: 0, samples: [] };
    entry.count += 1;
    if (entry.samples.length < 2 && report.raw_description) {
      entry.samples.push(report.raw_description.slice(0, 120));
    }
    subProblemCounts.set(sp, entry);

    const urg = (report.urgency || 'medium').toLowerCase() as ProblemUrgency;
    if (urg in urgencyCounts) {
      urgencyCounts[urg] += 1;
    } else {
      urgencyCounts.medium += 1;
    }

    if (report.target_users && Array.isArray(report.target_users)) {
      for (const u of report.target_users) targetUsersSet.add(u);
    }
  }

  const actualIdentifiedAreas = Array.from(subProblemCounts.entries()).map(
    ([name, data]) => ({
      name,
      count: data.count,
      percentage: Math.round((data.count / totalReports) * 1000) / 10,
      samples: data.samples,
    })
  );

  const userPrompt = JSON.stringify({
    cluster_title: cluster.title,
    cluster_category: cluster.category,
    total_verified_reports: totalReports,
    actual_sub_problems: actualIdentifiedAreas,
    urgency_distribution: urgencyCounts,
    sample_reports: reports.slice(0, 8).map((r) => ({
      title: r.normalized_title,
      description: r.raw_description,
      sub_problem: r.sub_problem,
      urgency: r.urgency,
    })),
  });

  try {
    const { data } = await executeGroqStructuredQuery<any>({
      systemPrompt: AGGREGATION_SYSTEM_PROMPT,
      userPrompt: `Generate the structured problem statement using these exact database report metrics:\n${userPrompt}`,
      schema: StructuredProblemStatementSchema,
      temperature: 0.1,
    });

    // Enforce strict statistical verification:
    // If the model altered any report counts or percentages, reconcile with actual numbers
    const verifiedAreas: IdentifiedSubProblemArea[] = actualIdentifiedAreas.map((actual) => {
      const modelArea = data.identified_areas?.find(
        (a: any) =>
          a.area_name.toLowerCase().includes(actual.name.toLowerCase()) ||
          actual.name.toLowerCase().includes(a.area_name.toLowerCase())
      );

      return {
        area_name: actual.name,
        description:
          modelArea?.description ||
          `Area impacting ${actual.count} commuter/citizen reports (${actual.percentage}% of cluster reports).`,
        report_count: actual.count, // STRICTLY GROUNDED
        percentage: actual.percentage, // STRICTLY GROUNDED
        sample_quotes: actual.samples,
      };
    });

    return {
      title: data.title || cluster.title,
      description: data.description,
      category: cluster.category,
      identified_areas: verifiedAreas,
      target_users:
        data.target_users && data.target_users.length > 0
          ? data.target_users
          : targetUsersSet.size > 0
          ? Array.from(targetUsersSet)
          : ['Daily commuters', 'Residents'],
      urgency_breakdown: urgencyCounts, // STRICTLY GROUNDED
      total_reports: totalReports, // STRICTLY GROUNDED
      recommended_solution_focus:
        data.recommended_solution_focus && data.recommended_solution_focus.length > 0
          ? data.recommended_solution_focus
          : verifiedAreas.map((a) => `Address ${a.area_name} challenges`),
      source: 'ai',
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    // Graceful fallback to deterministic synthesizer
    return fallbackGenerateStructuredProblem(cluster, reports);
  }
}
