import { NextRequest } from 'next/server';
import { SolutionsService } from '@/lib/services/solutions.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/solutions/[id]
 * Fetch solution details, solver profile, and like status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return errorResponse('VALIDATION_ERROR', 'Solution ID is required', 400);
    }

    const user = await getAuthenticatedUser();
    const solution = await SolutionsService.getSolutionById(id, user?.id);

    if (!solution) {
      return errorResponse('NOT_FOUND', 'Solution not found', 404);
    }

    return successResponse(solution, 'Solution retrieved successfully');
  } catch (error) {
    console.error('[GET /api/solutions/[id]] Error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to retrieve solution',
      500
    );
  }
}
