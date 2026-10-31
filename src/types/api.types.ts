import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Problem = Database['public']['Tables']['problems']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type Solution = Database['public']['Tables']['solutions']['Row'];
export type SolutionLike = Database['public']['Tables']['solution_likes']['Row'];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface SubProblemSummary {
  name: string;
  count: number;
}

export interface ProblemDetailResponse extends Problem {
  sub_problems: SubProblemSummary[];
  sample_reports: Array<Pick<Report, 'id' | 'original_text' | 'sub_problem' | 'created_at'>>;
  solutions: Array<Solution & {
    solver: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
    has_liked?: boolean;
  }>;
}

export interface SolutionDetailResponse extends Solution {
  solver: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
  problem: Pick<Problem, 'id' | 'title' | 'category' | 'status'>;
  has_liked?: boolean;
}

export interface PublicProfileResponse extends Profile {
  problem_count: number;
  solution_count: number;
  solutions: Array<Solution & {
    problem: Pick<Problem, 'id' | 'title' | 'category'>;
  }>;
  recent_reports: Array<Report & {
    problem: Pick<Problem, 'id' | 'title'>;
  }>;
}

// AI Service interfaces agreed with Member 3
export interface AIProblemClassification {
  is_valid: boolean;
  category: string;
  normalized_title: string;
  problem_description: string;
  keywords: string[];
  sub_problem: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  target_users: string[];
  rejection_reason?: string;
}

export interface AIMatchCandidate {
  id: string;
  title: string;
  description: string;
  category: string | null;
  keywords: string[] | null;
}

export interface AIProblemMatchingResult {
  match_found: boolean;
  matched_problem_id: string | null;
  confidence: number;
  sub_problem: string;
  reason: string;
}
