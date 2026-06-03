-- ============================================================
-- Migration 0016: Harden SECURITY DEFINER function exposure
--
-- Source: Supabase security advisors (2026-06-03)
--   - 0028/0029 anon|authenticated_security_definer_function_executable
--   - 0011 function_search_path_mutable
--
-- Problem:
--   Internal trigger / helper functions are exposed via PostgREST
--   (/rest/v1/rpc/<fn>) and callable by the `anon` and `authenticated`
--   roles. They are meant to run only as triggers or be invoked by other
--   DB functions — never directly by clients. The web app makes ZERO
--   `.rpc()` calls, so revoking REST EXECUTE breaks nothing client-side.
--   Internal SECURITY DEFINER calls (e.g. triggers calling is_teacher_pro)
--   continue to work because they do not go through role grants.
--
-- Fix:
--   1. REVOKE EXECUTE on these functions from anon + authenticated.
--   2. Pin a non-mutable search_path on the two flagged functions.
-- ============================================================

-- 1. Remove REST exposure of internal functions ----------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()               FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_teacher_search_vector() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_student_limit()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_ai_report_limit()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_inquiry_rate_limit()   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_rating_rate_limit()    FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits()      FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_client_plan_tampering() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_teacher_pro(uuid)           FROM anon, authenticated;

-- 2. Pin search_path on the two functions advisors flagged as mutable -------
--    `public` keeps existing unqualified references working while removing
--    the role-mutable warning (pg_catalog stays implicitly first).
ALTER FUNCTION public.set_updated_at()               SET search_path = public;
ALTER FUNCTION public.update_teacher_search_vector() SET search_path = public;
