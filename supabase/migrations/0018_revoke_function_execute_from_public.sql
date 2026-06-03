-- ============================================================
-- Migration 0018: Revoke function EXECUTE from PUBLIC (fixes 0016)
--
-- Why this exists:
--   Migration 0016 revoked EXECUTE from `anon` and `authenticated`, but the
--   security advisor warnings did NOT clear. Reason: Postgres grants EXECUTE
--   to the PUBLIC pseudo-role by default (ACL entry `=X/postgres`), and
--   anon/authenticated inherit it THROUGH PUBLIC. Revoking from those two
--   roles individually does nothing while the PUBLIC grant remains.
--
--   The correct remediation is to revoke from PUBLIC. `service_role` keeps its
--   own explicit grant (used by Edge Functions / internal calls). Trigger
--   functions fire as the table owner regardless of grants, and the web client
--   makes zero `.rpc()` calls, so nothing breaks.
--
-- Reversible: GRANT EXECUTE ON FUNCTION ... TO PUBLIC.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_teacher_search_vector() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_student_limit()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_ai_report_limit()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_inquiry_rate_limit()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_rating_rate_limit()    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_client_plan_tampering() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_teacher_pro(uuid)           FROM PUBLIC;
