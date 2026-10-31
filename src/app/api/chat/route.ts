import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatRequestSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { AIService } from '@/lib/services/ai.service';
import { ExistingCluster, UserDiscoveryProfile } from '@/lib/ai/types';
import { executeGroqStructuredQuery } from '@/lib/ai/groq-client';
import { z } from 'zod';

/**
 * POST /api/chat
 * Problem solver AI Assistant - coordinates real problem data with LLM recommendations
 * (Powered by Member 3 AI Discovery Module)
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Malformed JSON payload', 400);
    }

    const parseResult = ChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.format());
    }

    const { message, problem_id } = parseResult.data;
    const supabase = await createClient();

    if (problem_id) {
      // Fetch specific problem with solutions
      const { data: problem } = await supabase
        .from('problems')
        .select(`
          *,
          solutions(id, title, description, like_count)
        `)
        .eq('id', problem_id)
        .single();

      if (!problem) {
        return errorResponse('NOT_FOUND', 'Specified problem cluster not found', 404);
      }

      // Answer user query strictly grounded in this problem
      const systemPrompt = `You are Solvyn Assistant. You are advising a builder/solver on this specific real-world problem:
Title: "${problem.title}"
Category: ${problem.category}
Description: ${problem.description}
Report Count: ${problem.report_count}
Target Users: ${(problem.target_users || []).join(', ')}
Urgency: ${problem.urgency}
Existing Solutions: ${(problem.solutions || []).map((s: { title: string }) => s.title).join(', ') || 'None yet'}

Ground your answers strictly in the problem context. Suggest practical architectures, APIs, and impact solutions.`;

      const ChatAnswerSchema = z.object({
        reply: z.string(),
      });

      try {
        const { data } = await executeGroqStructuredQuery<{ reply: string }>({
          systemPrompt,
          userPrompt: message,
          schema: ChatAnswerSchema,
          temperature: 0.3,
        });
        return successResponse(data);
      } catch {
        return successResponse({
          reply: `For "${problem.title}", this issue currently has ${problem.report_count} verified citizen reports. High-impact areas for development include building accessible client apps or data bridges for ${problem.target_users?.join(', ') || 'affected stakeholders'}.`,
        });
      }
    }

    // General Discovery Recommendation Mode
    // Fetch active problems from database
    const { data: problems } = await supabase
      .from('problems')
      .select('id, title, description, category, report_count, status, keywords')
      .neq('status', 'archived')
      .order('report_count', { ascending: false })
      .limit(10);

    const availableClusters: ExistingCluster[] = (problems || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category || 'General',
      keywords: p.keywords || [],
      report_count: p.report_count,
    }));

    const profile: UserDiscoveryProfile = {
      skills: ['TypeScript', 'Full-stack', 'Mobile', 'AI'],
      interests: ['Civic Tech', 'Transportation', 'Healthcare', 'Public Good'],
      query: message,
    };

    const recommendation = await AIService.recommendProblems(profile, availableClusters);

    return successResponse({
      reply: recommendation.explanation,
      recommendations: recommendation.recommendations,
      total_problems_searched: recommendation.total_available_searched,
      source: recommendation.source,
    });
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return errorResponse(
      'CHAT_FAILED',
      error instanceof Error ? error.message : 'Chat operation failed',
      500
    );
  }
}
