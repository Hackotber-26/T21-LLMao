-- ==============================================================================
-- SOLVYN DATABASE FUNCTIONS AND TRIGGERS
-- Migration: 003_functions_triggers.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTOMATIC PROFILE CREATION ON USER SIGNUP (auth.users -> public.profiles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  chosen_username TEXT;
  suffix INTEGER := 0;
BEGIN
  -- Extract username from metadata or email prefix
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1),
    'user'
  );
  -- Sanitize username (alphanumeric and underscore)
  base_username := REGEXP_REPLACE(LOWER(base_username), '[^a-z0-9_]', '', 'g');
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;

  chosen_username := base_username;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = chosen_username) LOOP
    suffix := suffix + 1;
    chosen_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    chosen_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', chosen_username),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. AUTOMATIC REPORT COUNT TRACKING FOR PROBLEMS
-- Keeps problems.report_count in sync with actual rows in public.reports
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_problem_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.problems
    SET report_count = report_count + 1,
        updated_at = NOW()
    WHERE id = NEW.problem_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.problems
    SET report_count = GREATEST(report_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.problem_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.problem_id <> NEW.problem_id THEN
      UPDATE public.problems
      SET report_count = GREATEST(report_count - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.problem_id;

      UPDATE public.problems
      SET report_count = report_count + 1,
          updated_at = NOW()
      WHERE id = NEW.problem_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_problem_report_count ON public.reports;
CREATE TRIGGER trigger_update_problem_report_count
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_problem_report_count();

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC SOLUTION LIKE COUNT TRACKING
-- Keeps solutions.like_count in sync with actual rows in public.solution_likes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_solution_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.solutions
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = NEW.solution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.solutions
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.solution_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_solution_like_count ON public.solution_likes;
CREATE TRIGGER trigger_update_solution_like_count
  AFTER INSERT OR DELETE ON public.solution_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_solution_like_count();
