import { createClient } from '@/lib/supabase/server';
import { PublicProfileResponse } from '@/types/api.types';
import { z } from 'zod';
import { UpdateProfileSchema } from '@/lib/validation';

export class ProfilesService {
  /**
   * Fetch public user profile with their submitted solutions and reports
   */
  public static async getProfileByUsername(username: string): Promise<PublicProfileResponse | null> {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      return null;
    }

    // Solutions submitted by user
    const { data: solutions } = await supabase
      .from('solutions')
      .select(`
        *,
        problem:problems!solutions_problem_id_fkey(id, title, category)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    // Reports submitted by user
    const { data: reports } = await supabase
      .from('reports')
      .select(`
        *,
        problem:problems!reports_problem_id_fkey(id, title)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    const formattedSolutions = (solutions || []).map((s) => ({
      ...s,
      problem: Array.isArray(s.problem) ? s.problem[0] : s.problem,
    }));

    const formattedReports = (reports || []).map((r) => ({
      ...r,
      problem: Array.isArray(r.problem) ? r.problem[0] : r.problem,
    }));

    return {
      ...profile,
      problem_count: formattedReports.length,
      solution_count: formattedSolutions.length,
      solutions: formattedSolutions,
      recent_reports: formattedReports,
    };
  }

  /**
   * Update authenticated user's profile
   */
  public static async updateProfile(userId: string, data: z.infer<typeof UpdateProfileSchema>) {
    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update profile: ${error?.message}`);
    }

    return updated;
  }
}
