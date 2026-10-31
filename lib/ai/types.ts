import { z } from 'zod';

/**
 * Standard Solvyn Problem Categories
 */
export const PROBLEM_CATEGORIES = [
  'Transportation',
  'Healthcare',
  'Education',
  'Environment',
  'Agriculture',
  'Public Infrastructure',
  'Accessibility',
  'Finance',
  'Technology',
  'Community',
  'Housing',
  'Employment',
  'Public Services',
  'Sanitation',
  'Legal Rights',
  'Consumer Rights',
  'Disaster Relief',
  'Other',
] as const;

export type StandardProblemCategory = (typeof PROBLEM_CATEGORIES)[number];
export type ProblemCategory = StandardProblemCategory | (string & {});

export const ProblemUrgencySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ProblemUrgency = z.infer<typeof ProblemUrgencySchema>;

/**
 * Input submitted by user or external reporter
 */
export interface ProblemSubmissionInput {
  title?: string;
  description: string;
  location?: string;
  submittedCategory?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Zod Schema for Structured Problem Understanding and Validation Output
 */
export const ProblemUnderstandingSchema = z.object({
  is_valid: z.boolean(),
  category: z.enum(PROBLEM_CATEGORIES).or(z.string()),
  normalized_title: z.string().min(3),
  problem_description: z.string().min(10),
  keywords: z.array(z.string()).min(1),
  sub_problem: z.string().min(2),
  urgency: ProblemUrgencySchema,
  target_users: z.array(z.string()).min(1),
  reason: z.string(),
  is_spam: z.boolean().default(false),
  needs_clarification: z.boolean().default(false),
  clarification_question: z.string().nullable().optional(),
});

export type ProblemUnderstanding = z.infer<typeof ProblemUnderstandingSchema>;

/**
 * Full Validation Result returned to Member 2's backend
 */
export interface ProblemValidationResult extends ProblemUnderstanding {
  confidence: number;
  source: 'ai' | 'fallback';
  model_used?: string;
  processed_at: string;
}

/**
 * Simplified Classification Result
 */
export interface ProblemClassificationResult {
  category: ProblemCategory;
  sub_problem: string;
  keywords: string[];
  urgency: ProblemUrgency;
  confidence: number;
  source: 'ai' | 'fallback';
}

/**
 * Representation of an existing cluster in Supabase
 */
export interface ExistingCluster {
  id: string;
  title: string;
  description: string;
  category: string;
  sub_problems?: string[];
  keywords?: string[];
  report_count: number;
  created_at?: string;
  status?: 'active' | 'under_review' | 'resolved';
}

/**
 * Single problem report record from database
 */
export interface ProblemReport {
  id: string;
  cluster_id?: string | null;
  raw_description: string;
  normalized_title: string;
  sub_problem?: string;
  category: string;
  keywords?: string[];
  urgency?: ProblemUrgency;
  target_users?: string[];
  created_at?: string;
}

/**
 * Clustering decision output
 */
export type MatchDecision = 'MATCH_EXISTING' | 'NEW_CLUSTER' | 'NEEDS_REVIEW';

export const ClusterMatchingResultSchema = z.object({
  match_decision: z.enum(['MATCH_EXISTING', 'NEW_CLUSTER', 'NEEDS_REVIEW']),
  matched_cluster_id: z.string().nullable(),
  matched_cluster_title: z.string().nullable().optional(),
  sub_problem: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  flagged_for_review: z.boolean(),
  candidate_similarity_scores: z.record(z.string(), z.number()).optional(),
});

export type ClusterMatchingResult = z.infer<typeof ClusterMatchingResultSchema> & {
  source: 'ai' | 'fallback';
  model_used?: string;
  candidate_count: number;
};

/**
 * Structured Sub-Problem Area in aggregated problem statement
 */
export interface IdentifiedSubProblemArea {
  area_name: string;
  description: string;
  report_count: number;
  percentage: number;
  sample_quotes?: string[];
}

/**
 * Final Aggregated Problem Statement
 */
export const StructuredProblemStatementSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.string(),
  identified_areas: z.array(
    z.object({
      area_name: z.string(),
      description: z.string(),
      report_count: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
      sample_quotes: z.array(z.string()).optional(),
    })
  ),
  target_users: z.array(z.string()),
  urgency_breakdown: z.object({
    low: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
  }),
  total_reports: z.number().int().nonnegative(),
  recommended_solution_focus: z.array(z.string()),
});

export type StructuredProblemStatement = z.infer<typeof StructuredProblemStatementSchema> & {
  source: 'ai' | 'fallback';
  generated_at: string;
};

/**
 * Chatbot User Profile for discovery
 */
export interface UserDiscoveryProfile {
  skills: string[];
  interests: string[];
  preferred_categories?: string[];
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  query?: string;
}

/**
 * Chatbot Recommendation Item
 */
export interface RecommendedProblem {
  cluster_id: string;
  title: string;
  category: string;
  description: string;
  sub_problems: string[];
  actual_report_count: number;
  match_score: number;
  match_reasons: string[];
  suggested_contributions: string[];
}

export interface ProblemRecommendationResult {
  recommendations: RecommendedProblem[];
  total_available_searched: number;
  explanation: string;
  source: 'ai' | 'fallback';
}
