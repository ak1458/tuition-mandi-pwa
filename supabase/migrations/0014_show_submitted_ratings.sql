-- ============================================================
-- Migration 0014: Make submitted parent_ratings publicly visible
--
-- Problem: 0008 exposed parent_ratings via SELECT only when is_verified = true,
-- but is_verified defaults to false and nothing ever flips it (no trigger, no
-- admin tool). Result: every submitted review stayed hidden forever and the
-- teacher avg-rating sort always saw 0.
--
-- Inserts are already validated (non-empty name, rating 1-5, phone present,
-- length caps — see 0011) and rate-limited (3/teacher/24h, 10/phone/24h — see
-- 0012's enforce_rating_rate_limit trigger), so showing them on submit is safe.
--
-- We keep the is_verified column for a future "Takhti Verified review" badge,
-- but it no longer gates visibility.
--
-- SECURITY: opening row visibility to everyone means anon could otherwise read
-- the PII columns (parent_phone, ip_address) via a direct PostgREST query. RLS
-- is row-level only, so we add column-level REVOKEs to keep that PII private.
-- Only the safe, display-oriented columns stay readable.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read verified ratings" ON public.parent_ratings;

CREATE POLICY "Anyone can read submitted ratings"
  ON public.parent_ratings FOR SELECT
  USING (true);

-- ----------------------------------------------------------
-- Column-level privacy: hide reviewer PII from public/auth roles.
-- PostgREST honours column privileges — a query that selects these columns
-- now errors, while the app's existing review query (id, rating, review_text,
-- parent_name, student_class, subject_taught, created_at) keeps working.
-- ----------------------------------------------------------
REVOKE SELECT (parent_phone, ip_address) ON public.parent_ratings FROM anon;
REVOKE SELECT (parent_phone, ip_address) ON public.parent_ratings FROM authenticated;
