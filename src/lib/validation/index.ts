import { z } from 'zod';

export const ProblemQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'solved', 'archived']).optional(),
  sort: z.enum(['newest', 'oldest', 'most_reported', 'trending']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const SubmitReportSchema = z.object({
  original_text: z.string().min(10, 'Report text must be at least 10 characters long').max(3000),
  category: z.string().optional(),
  location: z.string().optional(),
});

export const SubmitSolutionSchema = z.object({
  problem_id: z.string().uuid('Invalid problem ID format'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  github_url: z.string().url('Invalid GitHub URL').nullable().optional(),
  demo_url: z.string().url('Invalid Demo URL').nullable().optional(),
  live_url: z.string().url('Invalid Live URL').nullable().optional(),
  video_url: z.string().url('Invalid Video URL').nullable().optional(),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores').optional(),
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string().max(50)).optional(),
  interests: z.array(z.string().max(50)).optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  problem_id: z.string().uuid().optional(),
});
