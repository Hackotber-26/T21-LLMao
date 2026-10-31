-- ==============================================================================
-- SOLVYN ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies.sql
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_likes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- Anyone can view profiles, authenticated user can insert/update their own profile
-- ------------------------------------------------------------------------------
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. PROBLEMS POLICIES
-- Aggregated problem statements are public viewable.
-- Creation/update by authenticated users or backend service role.
-- ------------------------------------------------------------------------------
CREATE POLICY "Problems are viewable by everyone" 
ON public.problems FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create problems" 
ON public.problems FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems" 
ON public.problems FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. REPORTS POLICIES
-- Everyone can view reports attached to problems.
-- Authenticated users can insert their own reports.
-- ------------------------------------------------------------------------------
CREATE POLICY "Reports are viewable by everyone" 
ON public.reports FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can submit reports" 
ON public.reports FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ------------------------------------------------------------------------------
-- 4. SOLUTIONS POLICIES
-- Public can view solutions.
-- Authenticated users can insert solutions.
-- Authors can update or delete their own solutions.
-- ------------------------------------------------------------------------------
CREATE POLICY "Solutions are viewable by everyone" 
ON public.solutions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create solutions" 
ON public.solutions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solutions" 
ON public.solutions FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solutions" 
ON public.solutions FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. SOLUTION_LIKES POLICIES
-- Public can view likes.
-- Authenticated users can like (insert) for themselves.
-- Users can unlike (delete) their own like.
-- ------------------------------------------------------------------------------
CREATE POLICY "Likes are viewable by everyone" 
ON public.solution_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like solutions" 
ON public.solution_likes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.solution_likes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
