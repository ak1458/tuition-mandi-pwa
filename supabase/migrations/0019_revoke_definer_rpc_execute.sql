-- 0019_revoke_definer_rpc_execute.sql
-- Security hardening (Supabase advisor 0028/0029):
-- Trigger + helper SECURITY DEFINER functions were still callable as RPC by the
-- `anon` and `authenticated` API roles. Migration 0018 revoked EXECUTE from
-- PUBLIC, but Supabase auto-grants EXECUTE to `anon`/`authenticated`, so they
-- remained reachable via /rest/v1/rpc/<fn>. Revoke explicitly from those roles.
--
-- These functions are invoked internally by triggers / RLS policies (which run
-- as the function owner regardless of role grants), so revoking direct EXECUTE
-- does NOT break app behaviour — it only removes the unintended public RPC.

do $$
declare
  fn text;
  fns text[] := array[
    'public.cleanup_old_rate_limits()',
    'public.enforce_ai_report_limit()',
    'public.enforce_inquiry_rate_limit()',
    'public.enforce_rating_rate_limit()',
    'public.enforce_student_limit()',
    'public.handle_new_user()',
    'public.is_teacher_pro(uuid)',
    'public.prevent_client_plan_tampering()'
  ];
begin
  foreach fn in array fns loop
    -- Skip silently if a signature drifts in a future schema change.
    begin
      execute format('revoke execute on function %s from anon, authenticated, public;', fn);
    exception when undefined_function then
      raise notice 'skip (not found): %', fn;
    end;
  end loop;
end$$;
