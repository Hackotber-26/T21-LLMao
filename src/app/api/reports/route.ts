import { NextRequest } from 'next/server';
import { ReportsService } from '@/lib/services/reports.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { SubmitReportSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * POST /api/reports
 * Submit a new real-world problem report:
 * - Authenticates user (optional or authenticated)
 * - Validates schema
 * - Triggers AI classification & cluster matching
 * - Persists report & links to existing/new problem cluster
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    // Optional: allow anonymous or require auth. The requirement states:
    // "Authenticate user. Validate request using Zod."
    // If unauthenticated, return 401:
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'You must be logged in to submit a report', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Malformed JSON payload', 400);
    }

    const parseResult = SubmitReportSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.format());
    }

    const { original_text, category } = parseResult.data;

    const result = await ReportsService.submitReport(
      user.id,
      original_text,
      category
    );

    return successResponse(result, 'Problem report submitted and clustered successfully', 201);
  } catch (error) {
    console.error('[POST /api/reports] Error:', error);
    return errorResponse(
      'REPORT_SUBMISSION_FAILED',
      error instanceof Error ? error.message : 'Failed to submit problem report',
      500
    );
  }
}
