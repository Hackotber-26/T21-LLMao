import { NextRequest } from 'next/server';
import { ProblemsService } from '@/lib/services/problems.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/problems/[id]
 * Fetch detailed problem information, report breakdown, and solutions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return errorResponse('VALIDATION_ERROR', 'Problem ID is required', 400);
    }

    const user = await getAuthenticatedUser();
    const problem = await ProblemsService.getProblemById(id, user?.id);

    if (!problem) {
      return errorResponse('NOT_FOUND', 'Problem not found', 404);
    }

    return successResponse(problem, 'Problem details retrieved successfully');
  } catch (error) {
    console.error('[GET /api/problems/[id]] Error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to retrieve problem details',
      500
    );
  }
}
