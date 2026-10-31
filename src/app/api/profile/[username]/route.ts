import { NextRequest } from 'next/server';
import { ProfilesService } from '@/lib/services/profiles.service';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { UpdateProfileSchema } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/profile/[username]
 * Fetch public profile details, reported problems, and submitted solutions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!username) {
      return errorResponse('VALIDATION_ERROR', 'Username is required', 400);
    }

    const profile = await ProfilesService.getProfileByUsername(username);
    if (!profile) {
      return errorResponse('NOT_FOUND', 'User profile not found', 404);
    }

    return successResponse(profile, 'Profile retrieved successfully');
  } catch (error) {
    console.error('[GET /api/profile/[username]] Error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Failed to retrieve profile',
      500
    );
  }
}

/**
 * PATCH /api/profile/[username]
 * Update authenticated user's own profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Verify ownership
    const currentProfile = await ProfilesService.getProfileByUsername(username);
    if (!currentProfile || currentProfile.id !== user.id) {
      return errorResponse('FORBIDDEN', 'You can only update your own profile', 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Malformed JSON payload', 400);
    }

    const parseResult = UpdateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Validation failed', 400, parseResult.error.format());
    }

    const updated = await ProfilesService.updateProfile(user.id, parseResult.data);
    return successResponse(updated, 'Profile updated successfully');
  } catch (error) {
    console.error('[PATCH /api/profile/[username]] Error:', error);
    return errorResponse(
      'PROFILE_UPDATE_FAILED',
      error instanceof Error ? error.message : 'Failed to update profile',
      500
    );
  }
}
