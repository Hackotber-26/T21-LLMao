import { z } from 'zod';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validates a URL using the native JavaScript URL constructor.
 * @param rawUrl The raw URL string input
 * @param type 'github' requires github.com domain; 'https' requires https protocol
 */
export function validateUrlWithConstructor(
  rawUrl: string | null | undefined,
  type: 'github' | 'https'
): UrlValidationResult {
  if (!rawUrl || rawUrl.trim() === '') {
    return { isValid: true, normalized: undefined };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid, well-formed URL (e.g. https://example.com)',
    };
  }

  if (type === 'github') {
    const hostname = parsed.hostname.toLowerCase();
    const isGithub = hostname === 'github.com' || hostname === 'www.github.com';
    if (!isGithub) {
      return {
        isValid: false,
        error: 'GitHub repository URL must point to github.com (e.g. https://github.com/owner/repo)',
      };
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        isValid: false,
        error: 'GitHub URL must use HTTP or HTTPS protocol',
      };
    }
  } else {
    if (parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use secure HTTPS protocol (e.g. https://...)',
      };
    }
  }

  return { isValid: true, normalized: trimmed };
}

export const SolutionFormSchema = z.object({
  problem_id: z
    .string()
    .uuid('A valid Problem ID (UUID) is required'),
  title: z
    .string()
    .trim()
    .min(3, 'Solution title must be at least 3 characters')
    .max(200, 'Solution title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Solution description must be at least 20 characters')
    .max(5000, 'Solution description cannot exceed 5000 characters'),
  github_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => validateUrlWithConstructor(val, 'github').isValid, {
      message: 'GitHub URL must point to github.com',
    }),
  video_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => validateUrlWithConstructor(val, 'https').isValid, {
      message: 'Demo video URL must use HTTPS',
    }),
  live_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => validateUrlWithConstructor(val, 'https').isValid, {
      message: 'Live application URL must use HTTPS',
    }),
  demo_url: z
    .string()
    .trim()
    .optional()
    .refine((val) => validateUrlWithConstructor(val, 'https').isValid, {
      message: 'Prototype/Figma URL must use HTTPS',
    }),
});

export type SolutionFormValues = z.infer<typeof SolutionFormSchema>;
