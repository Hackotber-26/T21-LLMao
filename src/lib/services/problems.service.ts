import { createClient } from '@/lib/supabase/server';
import { Problem, ProblemDetailResponse, SubProblemSummary } from '@/types/api.types';
import { z } from 'zod';
import { ProblemQuerySchema } from '@/lib/validation';

export class ProblemsService {
  /**
   * List problems with search, filtering, sorting, and pagination
   */
  public static async listProblems(params: z.infer<typeof ProblemQuerySchema>) {
    const supabase = await createClient();
    const { q, category, status, sort, page, limit } = params;

    let query = supabase.from('problems').select('*', { count: 'exact' });

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (q) {
      // Search in title, description, or category
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_reported':
        query = query.order('report_count', { ascending: false });
        break;
      case 'trending':
        // Trending: combination of high report count and recent updates
        query = query.order('report_count', { ascending: false }).order('updated_at', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch problems: ${error.message}`);
    }

    const problemsList = (data as Problem[]) || [];

    // Fetch actual solution counts per problem
    let solutionCountsMap: Record<string, number> = {};
    if (problemsList.length > 0) {
      const problemIds = problemsList.map((p) => p.id);
      const { data: solRows } = await supabase
        .from('solutions')
        .select('problem_id')
        .in('problem_id', problemIds);

      (solRows || []).forEach((row) => {
        solutionCountsMap[row.problem_id] = (solutionCountsMap[row.problem_id] || 0) + 1;
      });
    }

    const itemsWithCounts = problemsList.map((p) => ({
      ...p,
      solution_count: solutionCountsMap[p.id] || 0,
    }));

    const total = count || 0;
    return {
      items: itemsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get problem details with sub-problems breakdown, sample reports, and submitted solutions
   */
  public static async getProblemById(id: string, currentUserId?: string): Promise<ProblemDetailResponse | null> {
    const supabase = await createClient();

    // 1. Fetch problem
    const { data: problem, error: pError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();

    if (pError || !problem) {
      return null;
    }

    // 2. Fetch reports to calculate sub-problems summary & sample reports
    const { data: reports } = await supabase
      .from('reports')
      .select('id, original_text, sub_problem, created_at')
      .eq('problem_id', id)
      .order('created_at', { ascending: false });

    const subProblemMap: Record<string, number> = {};
    (reports || []).forEach((r) => {
      const name = r.sub_problem || 'General';
      subProblemMap[name] = (subProblemMap[name] || 0) + 1;
    });

    const sub_problems: SubProblemSummary[] = Object.entries(subProblemMap).map(([name, count]) => ({
      name,
      count,
    }));

    // 3. Fetch solutions
    const { data: solutions } = await supabase
      .from('solutions')
      .select(`
        *,
        solver:profiles!solutions_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('problem_id', id)
      .order('like_count', { ascending: false });

    // 4. Check if current user liked solutions
    const userLikedSolutionIds = new Set<string>();
    if (currentUserId && solutions && solutions.length > 0) {
      const solutionIds = solutions.map((s) => s.id);
      const { data: userLikes } = await supabase
        .from('solution_likes')
        .select('solution_id')
        .eq('user_id', currentUserId)
        .in('solution_id', solutionIds);

      if (userLikes) {
        userLikes.forEach((l) => userLikedSolutionIds.add(l.solution_id));
      }
    }

    const formattedSolutions = (solutions || []).map((sol) => ({
      ...sol,
      solver: Array.isArray(sol.solver) ? sol.solver[0] : sol.solver,
      has_liked: userLikedSolutionIds.has(sol.id),
    }));

    return {
      ...(problem as Problem),
      sub_problems,
      sample_reports: (reports || []).slice(0, 5),
      solutions: formattedSolutions,
    };
  }
}
