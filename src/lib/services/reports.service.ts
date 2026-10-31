import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIService } from './ai.service';
import { ExistingCluster } from '@/lib/ai/types';
import { Problem } from '@/types/api.types';

export class ReportsService {
  /**
   * Submit a new real-world problem report through the complete AI pipeline:
   * 1. Authenticate & validate request
   * 2. AI validates and normalizes report
   * 3. Retrieve real candidate problem clusters from Supabase
   * 4. AI evaluates hierarchical clustering (MATCH_EXISTING vs NEW_CLUSTER)
   * 5. Persist original report without overwriting raw user text
   * 6. Return updated cluster and report metadata
   */
  public static async submitReport(
    userId: string | null,
    originalText: string,
    category?: string,
    location?: string
  ) {
    const supabase = createAdminClient();

    // 1. AI Validation and Understanding
    const validation = await AIService.validateAndClassifyProblem(
      originalText,
      category,
      location
    );

    if (!validation.is_valid) {
      throw new Error(
        validation.reason ||
          'Report was not recognized as a valid real-world problem statement'
      );
    }

    // 2. Fetch candidate clusters from Supabase
    // Pre-filter active/open problems
    let candidateQuery = supabase
      .from('problems')
      .select('id, title, description, category, keywords, report_count, status')
      .neq('status', 'archived')
      .order('report_count', { ascending: false })
      .limit(20);

    const { data: rawCandidates, error: candError } = await candidateQuery;
    if (candError) {
      console.warn('[ReportsService] Candidate query error:', candError.message);
    }

    const candidateClusters: ExistingCluster[] = (rawCandidates || []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category || 'General',
      keywords: c.keywords || [],
      report_count: c.report_count,
      status: c.status === 'solved' ? 'resolved' : 'active',
    }));

    // 3. AI Hierarchical Clustering & Sub-problem Identification
    const matchingResult = await AIService.findRelatedProblems(
      {
        title: validation.normalized_title,
        description: originalText,
        submittedCategory: validation.category,
      },
      candidateClusters
    );

    let targetProblemId: string;
    let isNewCluster = false;

    // Check if match was found with high confidence
    if (
      matchingResult.match_decision === 'MATCH_EXISTING' &&
      matchingResult.matched_cluster_id
    ) {
      targetProblemId = matchingResult.matched_cluster_id;

      // Update cluster's target_users if new demographics identified
      if (validation.target_users && validation.target_users.length > 0) {
        const existingCluster = candidateClusters.find((c) => c.id === targetProblemId);
        if (existingCluster) {
          const { data: currentProblem } = await supabase
            .from('problems')
            .select('target_users')
            .eq('id', targetProblemId)
            .single();

          const existingUsers = currentProblem?.target_users || [];
          const combined = Array.from(new Set([...existingUsers, ...validation.target_users]));

          await supabase
            .from('problems')
            .update({ target_users: combined, updated_at: new Date().toISOString() })
            .eq('id', targetProblemId);
        }
      }
    } else {
      // Create a brand new problem cluster
      isNewCluster = true;
      const { data: newProblem, error: createError } = await supabase
        .from('problems')
        .insert({
          title: validation.normalized_title,
          description: validation.problem_description,
          category: validation.category,
          keywords: validation.keywords,
          urgency: validation.urgency,
          target_users: validation.target_users,
          status: 'open',
          report_count: 0, // Automatically managed by DB trigger on report insert
        })
        .select()
        .single();

      if (createError || !newProblem) {
        throw new Error(`Failed to create problem cluster: ${createError?.message}`);
      }

      targetProblemId = newProblem.id;
    }

    // 4. Persist the individual user report (Never overwrite or alter raw original_text)
    const { data: savedReport, error: reportError } = await supabase
      .from('reports')
      .insert({
        problem_id: targetProblemId,
        user_id: userId,
        original_text: originalText,
        sub_problem: matchingResult.sub_problem || validation.sub_problem,
        category: validation.category,
      })
      .select()
      .single();

    if (reportError || !savedReport) {
      throw new Error(`Failed to save report: ${reportError?.message}`);
    }

    // 5. Fetch updated problem record (with reliable DB trigger updated report_count)
    const { data: updatedProblem } = await supabase
      .from('problems')
      .select('*')
      .eq('id', targetProblemId)
      .single();

    return {
      report: savedReport,
      problem: updatedProblem as Problem,
      clustering: {
        is_new_cluster: isNewCluster,
        decision: matchingResult.match_decision,
        confidence: matchingResult.confidence,
        sub_problem: savedReport.sub_problem,
        reason: matchingResult.reason,
        flagged_for_review: matchingResult.flagged_for_review,
      },
      ai_validation: {
        category: validation.category,
        normalized_title: validation.normalized_title,
        urgency: validation.urgency,
        target_users: validation.target_users,
        source: validation.source,
      },
    };
  }
}
