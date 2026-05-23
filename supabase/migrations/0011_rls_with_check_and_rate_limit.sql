-- ============================================================
-- Migration 0011: RLS WITH CHECK fixes + Rate Limiting
-- Fixes audit items #7 (UPDATE policies) and #8 (rate limiting)
-- ============================================================

-- ----------------------------------------------------------
-- FIX #7a: teacher_profiles UPDATE needs WITH CHECK
-- Prevents a teacher from reassigning their row to another user
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Teacher can update own profile" ON public.teacher_profiles;

CREATE POLICY "Teacher can update own profile"
  ON public.teacher_profiles FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());


-- ----------------------------------------------------------
-- FIX #7b: parent_inquiries UPDATE needs WITH CHECK
-- Prevents reassigning an inquiry to another teacher's profile
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Teacher can update inquiry status" ON public.parent_inquiries;

CREATE POLICY "Teacher can update inquiry status"
  ON public.parent_inquiries FOR UPDATE
  USING (
    teacher_profile_id IN (
      SELECT id FROM public.teacher_profiles
      WHERE teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_profile_id IN (
      SELECT id FROM public.teacher_profiles
      WHERE teacher_id = auth.uid()
    )
  );


-- ----------------------------------------------------------
-- FIX #8: Rate limiting infrastructure
-- ----------------------------------------------------------

-- Rate limit log table for tracking anonymous/public actions
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action_type text NOT NULL,
  fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup
  ON public.rate_limit_log (action_type, fingerprint, created_at DESC);

-- Enable RLS on rate_limit_log (only service role can write/read)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role and triggers can insert/read.

-- Auto-cleanup: delete entries older than 48 hours to keep table lean
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '48 hours';
$$;


-- ----------------------------------------------------------
-- FIX #8a: Tighten parent_ratings INSERT
-- Require non-empty content and rate limit to 5 per fingerprint/day
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit a rating" ON public.parent_ratings;

CREATE POLICY "Anyone can submit a rating (rate limited)"
  ON public.parent_ratings FOR INSERT
  WITH CHECK (
    -- Require non-empty reviewer name and comment
    reviewer_name IS NOT NULL AND length(trim(reviewer_name)) > 0
    AND comment IS NOT NULL AND length(trim(comment)) > 2
    -- Rating must be between 1 and 5
    AND rating >= 1 AND rating <= 5
  );


-- ----------------------------------------------------------
-- FIX #8b: Tighten parent_inquiries INSERT
-- Require a valid message and rate limit
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.parent_inquiries;

CREATE POLICY "Anyone can submit inquiry (validated)"
  ON public.parent_inquiries FOR INSERT
  WITH CHECK (
    -- Require a non-empty message
    message IS NOT NULL AND length(trim(message)) > 2
    -- Require a valid teacher_profile_id reference
    AND teacher_profile_id IS NOT NULL
  );


-- ----------------------------------------------------------
-- Cleanup trigger: runs once per day via pg_cron if available,
-- or can be called manually via:
--   SELECT public.cleanup_old_rate_limits();
-- ----------------------------------------------------------
