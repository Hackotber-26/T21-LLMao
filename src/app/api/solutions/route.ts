import { NextRequest } from 'next/server';
import { SolutionsService } from '@/lib/services/solutions.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { SubmitSolutionSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * POST /api/solutions
 * Submit a solution for a problem
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required to submit a solution', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Malformed JSON payload', 400);
    }

    const parseResult = SubmitSolutionSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.format());
    }

    const solution = await SolutionsService.submitSolution(user.id, parseResult.data);
    return successResponse(solution, 'Solution submitted successfully', 201);
  } catch (error) {
    console.error('[POST /api/solutions] Error:', error);
    return errorResponse(
      'SOLUTION_SUBMISSION_FAILED',
      error instanceof Error ? error.message : 'Failed to submit solution',
      500
    );
  }
}
