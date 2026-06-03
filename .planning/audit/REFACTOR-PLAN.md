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
- **Risk:** Low — these are trigger bodies, not meant to be called directly. `is_teacher_pro` is the one to keep callable if the client uses it (verify before revoking). **Migration written; apply via `supabase db push` after review.**
- **Status:** ✅ drafted this session — `supabase/migrations/0016_harden_function_exposure.sql`

## P1 — Close real feature gaps

### 1.1 PWA periodic update poll (CODE)
- **Why:** Installed PWA doesn't notice new deploys until reopened.
- **Do:** after register, `setInterval(() => reg.update(), 60*60*1000)` + `reg.update()` on `visibilitychange`→visible.
- **Risk:** Very low. **Status:** ✅ implemented this session.

### 1.2 Confirm `rate_limit_log` access path (HUMAN/CODE)
- Confirm only SECURITY DEFINER functions touch it; otherwise add a deny-all or owner policy.

## P2 — Performance (before scale, not before launch)

### 2.1 RLS `initplan` fix (CODE — migration)
- Rewrite 45 policies: `auth.uid()` → `(select auth.uid())`. Mechanical but touches every policy → do as one reviewed migration, test with real rows first. **Not auto-applied — security surface.**

### 2.2 Consolidate 12 overlapping permissive policies; add 3 FK indexes; drop unused indexes only after real-traffic confirmation.

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
