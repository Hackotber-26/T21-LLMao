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
    const userId = user?.id || null;

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

    const { original_text, category, location } = parseResult.data;

    const result = await ReportsService.submitReport(
      userId,
      original_text,
      category,
      location
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
