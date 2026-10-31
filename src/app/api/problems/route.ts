import { NextRequest } from 'next/server';
import { ProblemsService } from '@/lib/services/problems.service';
import { ProblemQuerySchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/problems
 * Discover real-world problems feed with filtering, search & pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parseResult = ProblemQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, parseResult.error.format());
    }

    const data = await ProblemsService.listProblems(parseResult.data);
    return successResponse(data, 'Problems retrieved successfully');
  } catch (error) {
    console.error('[GET /api/problems] Error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to retrieve problems',
      500
    );
  }
}
