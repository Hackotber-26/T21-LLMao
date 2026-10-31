import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatRequestSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import Groq from 'groq-sdk';

/**
 * POST /api/chat
 * Problem solver AI Assistant - coordinates real problem data with LLM recommendations
 * (Designed for integration with Member 3 and Member 4)
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

    let contextData = '';

    if (problem_id) {
      // Fetch specific problem with reports and solutions
      const { data: problem } = await supabase
        .from('problems')
        .select(`
          *,
          solutions(id, title, description, like_count)
        `)
        .eq('id', problem_id)
        .single();

      if (problem) {
        contextData = `Currently Discussing Problem:
Title: ${problem.title}
Description: ${problem.description}
Category: ${problem.category}
Report Count: ${problem.report_count}
Existing Solutions: ${problem.solutions?.map((s) => s.title).join(', ') || 'None yet'}`;
      }
    } else {
      // General discovery: retrieve top 5 real problems from database
      const { data: problems } = await supabase
        .from('problems')
        .select('id, title, description, category, report_count')
        .order('report_count', { ascending: false })
        .limit(5);

      if (problems && problems.length > 0) {
        contextData = `Active Real-World Problems on Solvyn:
${problems.map((p) => `- [${p.id}] "${p.title}" (${p.category || 'General'}, ${p.report_count} reports): ${p.description}`).join('\n')}`;
      }
    }

    if (!process.env.GROQ_API_KEY) {
      return successResponse({
        reply: `Solvyn Assistant Context:\n${contextData ? contextData + '\n\n' : ''}AI service is awaiting GROQ_API_KEY configuration in .env.local.`,
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const systemPrompt = `You are Solvyn Assistant, helping builders, developers, and students discover real-world problems and brainstorm actionable solutions.
Ground your answers ONLY in the real problems provided in the context below. Do not fabricate fake problem entities.
Context:
${contextData}`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content || 'I could not generate a response at this time.';

    return successResponse({ reply });
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return errorResponse(
      'CHAT_FAILED',
      error instanceof Error ? error.message : 'Chat operation failed',
      500
    );
  }
}
