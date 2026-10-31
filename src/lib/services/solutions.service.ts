import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Solution, SolutionDetailResponse } from '@/types/api.types';
import { z } from 'zod';
import { SubmitSolutionSchema } from '@/lib/validation';

export class SolutionsService {
  /**
   * Submit a new solution
   */
  public static async submitSolution(userId: string, payload: z.infer<typeof SubmitSolutionSchema>) {
    const supabase = createAdminClient();

    // Verify problem exists
    const { data: problem, error: pError } = await supabase
      .from('problems')
      .select('id')
      .eq('id', payload.problem_id)
      .single();

    if (pError || !problem) {
      throw new Error('Problem not found');
    }

    const { data: solution, error } = await supabase
      .from('solutions')
      .insert({
        problem_id: payload.problem_id,
        user_id: userId,
        title: payload.title,
        description: payload.description,
        github_url: payload.github_url || null,
        demo_url: payload.demo_url || null,
        live_url: payload.live_url || null,
        video_url: payload.video_url || null,
        like_count: 0,
      })
      .select(`
        *,
        solver:profiles!solutions_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .single();

    if (error || !solution) {
      throw new Error(`Failed to submit solution: ${error?.message}`);
    }

    return solution;
  }

  /**
   * Get solution by ID
   */
  public static async getSolutionById(id: string, currentUserId?: string): Promise<SolutionDetailResponse | null> {
    const supabase = await createClient();

    const { data: solution, error } = await supabase
      .from('solutions')
      .select(`
        *,
        solver:profiles!solutions_user_id_fkey(id, username, full_name, avatar_url),
        problem:problems!solutions_problem_id_fkey(id, title, category, status)
      `)
      .eq('id', id)
      .single();

    if (error || !solution) {
      return null;
    }

    let hasLiked = false;
    if (currentUserId) {
      const { data: likeRecord } = await supabase
        .from('solution_likes')
        .select('id')
        .eq('solution_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      hasLiked = !!likeRecord;
    }

    return {
      ...(solution as Solution),
      solver: Array.isArray(solution.solver) ? solution.solver[0] : solution.solver,
      problem: Array.isArray(solution.problem) ? solution.problem[0] : solution.problem,
      has_liked: hasLiked,
    };
  }

  /**
   * Toggle like for authenticated user on a solution
   */
  public static async toggleLike(solutionId: string, userId: string) {
    const supabase = createAdminClient();

    // Check if solution exists
    const { data: solution, error: solError } = await supabase
      .from('solutions')
      .select('id, like_count')
      .eq('id', solutionId)
      .single();

    if (solError || !solution) {
      throw new Error('Solution not found');
    }

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('solution_likes')
      .select('id')
      .eq('solution_id', solutionId)
      .eq('user_id', userId)
      .maybeSingle();

    let liked = false;
    if (existingLike) {
      // User already liked -> remove like
      const { error: deleteError } = await supabase
        .from('solution_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        throw new Error(`Failed to remove like: ${deleteError.message}`);
      }
      liked = false;
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from('solution_likes')
        .insert({
          solution_id: solutionId,
          user_id: userId,
        });

      if (insertError) {
        throw new Error(`Failed to add like: ${insertError.message}`);
      }
      liked = true;
    }

    // Read the fresh like count updated by the trigger
    const { data: updatedSolution } = await supabase
      .from('solutions')
      .select('like_count')
      .eq('id', solutionId)
      .single();

    return {
      liked,
      like_count: updatedSolution?.like_count ?? (liked ? solution.like_count + 1 : Math.max(0, solution.like_count - 1)),
    };
  }
}
