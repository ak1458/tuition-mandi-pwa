# Takhti — Refactor / Hardening Plan

Derived from `PRODUCTION-READINESS-AUDIT.md`. Ordered by value × safety. Each item: scope, risk, and whether it is safe to autopilot or needs human action.

## P0 — Security (do first)

### 0.1 Verify phone-OTP provider (HUMAN — Supabase dashboard)
- **Why:** Brief's "anyone logs in" symptom is config, not code.
- **Do:** Supabase → Auth → Providers → Phone. Confirm a real SMS gateway (MSG91/Twilio) is wired and "test OTP" is OFF. Confirm rate limits.
- **Risk:** None (config check). **Cannot be done from code.**

### 0.2 Harden SECURITY DEFINER function exposure (CODE — migration `0016`)
- **Why:** 9 trigger functions are RPC-callable by `anon`/`authenticated`; 2 have mutable `search_path`.
- **Do:** `REVOKE EXECUTE` on trigger functions from `anon, authenticated`; `ALTER FUNCTION ... SET search_path = ''` on the two flagged.
- **Risk:** Low — these are trigger bodies, not meant to be called directly. The web client makes zero `.rpc()` calls. `service_role` keeps EXECUTE for Edge Functions.
- **Status:**
  - `0016_harden_function_exposure.sql` — APPLIED to prod. Fixed `search_path` (2/2 ✅) but the EXECUTE revoke was **ineffective**: it revoked from `anon`/`authenticated`, but those inherit EXECUTE from the `PUBLIC` pseudo-role, whose grant remained. Advisor warnings did NOT clear.
  - `0018_revoke_function_execute_from_public.sql` — the real fix: `REVOKE EXECUTE ... FROM PUBLIC`. Verified via transactional dry-run (ACL drops the `=X` PUBLIC entry, `service_role` retained). **NOT yet pushed — run `supabase db push` to apply.**
- **Lesson:** revoking from `anon`/`authenticated` ≠ revoking from `PUBLIC`. Always revoke from `PUBLIC`.

## P1 — Close real feature gaps

### 1.1 PWA periodic update poll (CODE)
- **Why:** Installed PWA doesn't notice new deploys until reopened.
- **Do:** after register, `setInterval(() => reg.update(), 60*60*1000)` + `reg.update()` on `visibilitychange`→visible.
- **Risk:** Very low. **Status:** ✅ implemented this session.

### 1.2 Confirm `rate_limit_log` access path (HUMAN/CODE)
- Confirm only SECURITY DEFINER functions touch it; otherwise add a deny-all or owner policy.

## P2 — Performance (before scale, not before launch)

### 2.1 RLS `initplan` fix (CODE — migration 0017) ✅ DRAFTED + VERIFIED, NOT PUSHED
- Rewrites all 45 policies: `auth.uid()` → `(select auth.uid())`. DDL generated directly from the live catalog (guaranteed to match current definitions), then transactional dry-run against the real DB passed and rolled back. Adds the 3 FK covering indexes too.
- **Action for you:** review `supabase/migrations/0017_rls_perf_initplan.sql`, then `npx supabase db push` (ideally on a branch/staging first).

### 2.2 Remaining (deferred — need judgement, not mechanical)
- ⬜ Consolidate 12 overlapping permissive policies (public-read + owner). **Not auto-merged** — merging changes access semantics; do deliberately.
- ✅ 3 FK indexes — folded into migration 0017.
- ⬜ Drop 26 "unused" indexes only after real traffic confirms they stay unused (currently unused only because the DB is empty).

## P3 — Cleanup & simplify (low risk)

- ✅ Removed unused `src/assets/react.svg`.
- ✅ Untracked `supabase/.temp/` (was tracked before the gitignore rule).
- ✅ Dropped unused `react-router-dom`; declared `react-router` directly (app imports from it). Verified by build.
- ~~Dedupe keepalive scripts~~ — **WONTFIX:** `supabase-keepalive.ps1` is an intentional Windows wrapper around `.mjs` (CI uses `.mjs`, local Windows task scheduler uses `.ps1`). Keep both.
- ⬜ Make AI-search city/subject lists data-driven (`features/marketplace`).
- ⬜ Add `ARCHITECTURE.md`.

## Explicitly NOT doing (would break product)

- ❌ Deleting `demo-trial.ts` (real trial feature).
- ❌ Deleting `local-data.ts` / `mutation-queue.ts` (offline-first cache).
- ❌ Touching Razorpay (brief says leave it).
- ❌ Ground-up rewrite / re-architecture (structure is healthy).

## Sequencing

1. Human: 0.1 phone provider + 1.2 + review 0.2 migration → `supabase db push`.
2. Code (safe, autopilot-able): 1.1 PWA ✅, P3 cleanup.
3. Pre-scale: P2 RLS perf migration (reviewed, tested on real rows).
