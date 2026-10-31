-- ==============================================================================
-- SOLVYN DATABASE INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- References auth.users(id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. PROBLEMS TABLE
-- Aggregated problem clusters
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    keywords TEXT[] DEFAULT '{}',
    urgency TEXT DEFAULT 'medium',
    target_users TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'solved', 'archived')),
    report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. REPORTS TABLE
-- Individual problem submissions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    sub_problem TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. SOLUTIONS TABLE
-- Solutions submitted for problems
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT,
    demo_url TEXT,
    live_url TEXT,
    video_url TEXT,
    like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. SOLUTION_LIKES TABLE
-- User likes tracking with unique constraint
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solution_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_solution_user_like UNIQUE (solution_id, user_id)
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE AND SEARCH
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON public.problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_report_count ON public.problems(report_count DESC);

-- Full-text search index for problems title and description
CREATE INDEX IF NOT EXISTS idx_problems_fts ON public.problems USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_reports_problem_id ON public.reports(problem_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON public.solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON public.solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_solutions_like_count ON public.solutions(like_count DESC);

CREATE INDEX IF NOT EXISTS idx_solution_likes_solution_id ON public.solution_likes(solution_id);
CREATE INDEX IF NOT EXISTS idx_solution_likes_user_id ON public.solution_likes(user_id);
