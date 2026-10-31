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
1. NEVER INVENT STATISTICS. You must strictly use the provided actual report counts, percentage metrics, and urgency distribution from the input.
2. Group the reports into coherent "identified_areas" (sub-problems) reflecting what users actually complained about, matching the provided actual_sub_problems.
3. For each identified area, write a clear 1-2 sentence description highlighting the pain points and include the exact provided report count and percentage.
4. Synthesize a professional, active "title" for the overarching problem (at least 5 characters).
5. Write a comprehensive "description" synthesizing the common threads across all citizen reports (at least 20 characters).
6. Target users must reflect the affected demographics based on the reports.
7. Recommend 2 to 4 concrete engineering/civic "recommended_solution_focus" areas.
8. Use only the supplied cluster and report information. Do not invent report IDs, quotes, users, categories, or statistics. Keep sample quotes grounded in the original raw descriptions. If there is insufficient information for a text field, return a sensible conservative description rather than inventing facts.
9. EXAMPLES ARE ILLUSTRATIVE ONLY: Any example below is purely illustrative for JSON schema formatting. NEVER copy example stakeholders (such as commuters or passengers), domain assumptions, statistics, quotes, or solution suggestions into another domain's output unless directly supported by the supplied input reports.

REQUIRED OUTPUT JSON SCHEMA:
You must respond ONLY with a valid JSON object. Do not enclose in markdown blocks, code fences, or add explanatory text outside the JSON.
The JSON object must contain ALL of these EXACT field names:
- "title": string (min 5 characters) — synthesized professional title.
- "description": string (min 20 characters) — comprehensive narrative problem description.
- "category": string — must match the supplied cluster_category.
- "identified_areas": array of objects, each containing:
  - "area_name": string — name of the sub-problem area.
  - "description": string — summary of affected users' pain points in this area.
  - "report_count": non-negative integer — exact report count from actual_sub_problems.
  - "percentage": number (0 to 100) — exact percentage from actual_sub_problems.
  - "sample_quotes": optional array of strings — actual excerpts from the raw descriptions.
- "target_users": array of strings — affected user groups based on the reports.
- "urgency_breakdown": object with exact integer tallies matching the supplied urgency_distribution:
  - "low": non-negative integer
  - "medium": non-negative integer
  - "high": non-negative integer
  - "critical": non-negative integer
- "total_reports": non-negative integer — exact number matching total_verified_reports.
- "recommended_solution_focus": array of 2 to 4 strings — concrete technical or civic solutions.

Example output format (illustrative schema structure only — do not copy example data to other domains):
{
  "title": "BMTC Real-Time Bus Location Tracking and Arrival Prediction Deficiencies",
  "description": "Multiple commuters report severe difficulties with BMTC buses, citing unavailable real-time GPS tracking and inaccurate ETA arrival predictions that lead to prolonged waits.",
  "category": "Transportation",
  "identified_areas": [
    {
      "area_name": "Real-time Bus Tracking",
      "description": "Commuters report that live GPS tracking on major corridors is completely unavailable, leaving passengers stranded.",
      "report_count": 2,
      "percentage": 66.7,
      "sample_quotes": [
        "I cannot track BMTC buses in real time on route 500D."
      ]
    },
    {
      "area_name": "ETA Accuracy & Arrival Predictions",
      "description": "Countdown clocks and arrival estimates are inaccurate by up to 30 minutes.",
      "report_count": 1,
      "percentage": 33.3,
      "sample_quotes": [
        "Bus arrival countdown clocks at the stop and on mobile are inaccurate by up to 30 minutes."
      ]
    }
  ],
  "target_users": [
    "Daily commuters",
    "Tech park workers",
    "Students",
    "Elderly passengers"
  ],
  "urgency_breakdown": {
    "low": 0,
    "medium": 2,
    "high": 1,
    "critical": 0
  },
  "total_reports": 3,
  "recommended_solution_focus": [
    "Deploy high-frequency GPS telemetry transceivers across active BMTC bus fleets",
    "Implement real-time GTFS-RT feed for accurate arrival countdown predictions",
    "Provide a dedicated lightweight public transit mobile tracker"
  ]
}`;

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
  const reportTargetUsersList: string[] = [];
  const seenUsers = new Set<string>();

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
      for (const u of report.target_users) {
        if (typeof u === 'string') {
          const trimmed = u.trim();
          const normalized = trimmed.toLowerCase();
          if (trimmed.length > 0 && !seenUsers.has(normalized)) {
            seenUsers.add(normalized);
            reportTargetUsersList.push(trimmed);
          }
        }
      }
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
          `Area impacting ${actual.count} verified citizen report(s) (${actual.percentage}% of cluster reports).`,
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
      // STRICT GROUNDING: If reports provide target users, use ONLY those report-derived users.
      // Deduplicate case-insensitively, trim whitespace, preserve first encountered display value and stable order.
      target_users:
        reportTargetUsersList.length > 0
          ? reportTargetUsersList
          : data.target_users && Array.isArray(data.target_users) && data.target_users.length > 0
          ? (() => {
              const modelUsers: string[] = [];
              const seen = new Set<string>();
              for (const u of data.target_users) {
                if (typeof u === 'string') {
                  const trimmed = u.trim();
                  const normalized = trimmed.toLowerCase();
                  if (trimmed.length > 0 && !seen.has(normalized)) {
                    seen.add(normalized);
                    modelUsers.push(trimmed);
                  }
                }
              }
              return modelUsers.length > 0 ? modelUsers : ['Affected community members', 'General public'];
            })()
          : ['Affected community members', 'General public'],
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

