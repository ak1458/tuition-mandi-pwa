-- ============================================================
-- Migration 0015: Fix teacher_profiles SELECT RLS Policy
--
-- Goal:
--   - Allow teachers to read their own profile even when is_active = false.
--   - Prevents duplicate key errors on onboarding/profile setup.
-- ============================================================

CREATE POLICY "Teacher can view own profile"
  ON public.teacher_profiles FOR SELECT
  USING (teacher_id = auth.uid());
