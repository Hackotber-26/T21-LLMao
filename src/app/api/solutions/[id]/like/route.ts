import { NextRequest } from 'next/server';
import { SolutionsService } from '@/lib/services/solutions.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * POST /api/solutions/[id]/like
 * Toggle like for the authenticated user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return errorResponse('VALIDATION_ERROR', 'Solution ID is required', 400);
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required to like a solution', 401);
    }

    const result = await SolutionsService.toggleLike(id, user.id);
    return successResponse(result, result.liked ? 'Solution liked' : 'Solution unliked');
  } catch (error) {
    console.error('[POST /api/solutions/[id]/like] Error:', error);
    return errorResponse(
      'LIKE_OPERATION_FAILED',
      error instanceof Error ? error.message : 'Failed to update like status',
      500
    );
  }
}
