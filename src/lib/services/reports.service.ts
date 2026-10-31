import { createClient } from '@/lib/supabase/server';
import { AIService } from './ai.service';
import { AIMatchCandidate, Problem } from '@/types/api.types';

export class ReportsService {
  /**
   * Submit a new real-world problem report:
   * 1. Validate & classify via AI
   * 2. Find candidate clusters in database
   * 3. Ask AI whether it belongs to an existing cluster or forms a new cluster
   * 4. Save individual report (preserving original text)
   * 5. Return updated problem info
   */
  public static async submitReport(userId: string | null, originalText: string, category?: string) {
    const supabase = await createClient();

    // 1. AI Classification
    const classification = await AIService.validateAndClassifyProblem(originalText, category);
    if (!classification.is_valid) {
      throw new Error(classification.rejection_reason || 'Report was not recognized as a valid real-world problem statement');
    }

    // 2. Fetch candidate clusters (same category or recent open problems)
    let candidateQuery = supabase
      .from('problems')
      .select('id, title, description, category, keywords')
      .neq('status', 'archived')
      .order('report_count', { ascending: false })
      .limit(20);

    if (classification.category) {
      candidateQuery = candidateQuery.ilike('category', `%${classification.category}%`);
    }

    const { data: candidates } = await candidateQuery;

    // 3. Match against candidates via AI
    const matchingResult = await AIService.findRelatedProblems(
      classification,
      (candidates as AIMatchCandidate[]) || []
    );

    let targetProblemId: string;

    if (matchingResult.match_found && matchingResult.matched_problem_id) {
      targetProblemId = matchingResult.matched_problem_id;
    } else {
      // Create new problem cluster
      const { data: newProblem, error: createError } = await supabase
        .from('problems')
        .insert({
          title: classification.normalized_title,
          description: classification.problem_description,
          category: classification.category,
          keywords: classification.keywords,
          urgency: classification.urgency,
          target_users: classification.target_users,
          status: 'open',
          report_count: 0, // Trigger will increment on report insert
        })
        .select()
        .single();

      if (createError || !newProblem) {
        throw new Error(`Failed to create problem cluster: ${createError?.message}`);
      }

      targetProblemId = newProblem.id;
    }

    // 4. Save the individual report (preserving raw original_text without alterations)
    const { data: savedReport, error: reportError } = await supabase
      .from('reports')
      .insert({
        problem_id: targetProblemId,
        user_id: userId,
        original_text: originalText,
        sub_problem: matchingResult.sub_problem || classification.sub_problem,
        category: classification.category,
      })
      .select()
      .single();

    if (reportError || !savedReport) {
      throw new Error(`Failed to save report: ${reportError?.message}`);
    }

    // 5. Fetch updated problem record (with updated report_count from trigger)
    const { data: updatedProblem } = await supabase
      .from('problems')
      .select('*')
      .eq('id', targetProblemId)
      .single();

    return {
      report: savedReport,
      problem: updatedProblem as Problem,
      ai_classification: classification,
      ai_matching: matchingResult,
    };
  }
}
