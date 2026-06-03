# Takhti — Production Readiness Audit

**Date:** 2026-06-03
**Auditor:** Claude (Opus 4.8)
**Scope:** `takhti app/` — Vite + React 19 + TypeScript + Supabase PWA marketplace
**Method:** Read-only static audit of source + live Supabase project (`iqcnhgwrxijxylcctlsg`) via MCP advisors, table inspection, and git history.

---

## Executive Summary

**The application is substantially more production-ready than the brief assumes.** Several premises in the audit brief describe a state that has *already been fixed* in prior commits (`disabled simulation mode`, `Remove demo/seed data for production launch`, `production hardening`). The real work is **verification, a handful of targeted gap-fixes, DB hardening, and cleanup** — not a ground-up refactor.

**Critical correction to the brief:** A literal "delete all demo/mock/local data" pass would **destroy shipping features**. `demo-trial.ts` is a real 72-hour trial feature; `local-data.ts` / `mutation-queue.ts` is the offline-first PWA cache. These are product, not fakes. Validate before removing (the brief's own Section 1 rule).

### Verdict by claim in the brief

| Brief claim | Reality | Verdict |
|---|---|---|
| "Any phone/random OTP logs in" | Code uses real `supabase.auth.signInWithOtp`/`verifyOtp`. No code bypass. If true, it is **Supabase-side phone-provider config** (test mode / unconfigured), not React code. | Verify in Supabase dashboard |
| "Mock/dummy data everywhere" | `isLocalMode = false`. Simulation disabled. DB is **real but empty (0 rows)**. "demo" = real trial feature. | Mostly already done |
| "Fake dashboards / placeholder stats" | Dashboards query real Supabase; they read empty because there are no users yet. | Not fake — empty |
| "No PWA update prompt" | Update flow **already implemented** (`use-sw-update.ts` + `sw-update-toast.tsx`). Real gap: no periodic update *poll*. | Small gap, fixable |
| "WhatsApp broken" | `wa.me` click-to-chat deep links (by design — not API auto-delivery). Works; only India 10-digit validation. | Working as designed |
| "Over-engineered / unmaintainable" | Clean feature-folder structure, typed, code-split, RLS everywhere. Reasonable. | Healthy |

---

## 1. Architecture Audit

- **Stack:** Vite 7, React 19, TS 5.9, react-router 7, Supabase JS 2, Tailwind 3, i18next (en / hi / hi-roman). No state library — React context (`auth-provider`, `plan-provider`) + hooks. Appropriate for the size.
- **Structure:** `src/features/<domain>/{pages,services}` + `src/lib`, `src/hooks`, `src/components/common`. Clear, junior-readable. Path alias `@/`.
- **Layers:** UI pages → feature `services/*.ts` → `lib/queries` / `supabase-client`. Good separation.
- **Edge functions (6):** `generate-progress-report` (AI, server-side Gemini), `upgrade-plan`, `razorpay-webhook`, `account-deletion`, `data-export`. Sensitive keys correctly server-side.
- **Verdict:** **Keep.** No re-architecture needed. Over-engineering is not the actual problem.

## 2. Database Audit (live)

16 tables, **all RLS-enabled, all 0 rows**. Tables: `profiles, batches, students, batch_students, attendance_sessions, attendance_records, fee_records, assessments, progress_reports, plan_payment_receipts, teacher_profiles, parent_ratings, teacher_outcomes, parent_inquiries, profile_boosts, rate_limit_log`.

- 15 migrations, linear and well-named (`0001`→`0015`). Demo seed added (`0003`,`0009`) then explicitly removed (`0013`). Clean history.
- **Empty DB** = pre-launch. No data migration needed; the app already uses real queries.
- **Performance advisors (86):** 45× `auth_rls_initplan` (RLS calls `auth.uid()` unwrapped → re-evaluated per row), 12× `multiple_permissive_policies`, 3× `unindexed_foreign_keys`, 26× `unused_index` (noise — empty DB). Low urgency at 0 rows; worth fixing before scale.
- **Verdict:** **Simplify later.** Schema is fine. Tune RLS for perf before real traffic (see Refactor Plan P2).

## 3. Authentication Audit

- Real Supabase auth: phone OTP, email+password (8-char min), Google OAuth, password reset/update. Consent payload (DPDP) captured at signup. Route guard + auth provider drive session state.
- **No code-level bypass exists.** The "anyone logs in" symptom, if reproducible, is **Supabase phone-provider configuration** (test OTP / provider not wired to a real SMS gateway like MSG91/Twilio). **Action: verify in Supabase Auth settings** — this is config, not code.
- **Real code-adjacent gap:** `rate_limit_log` has RLS enabled but **no policy** (advisor `rls_enabled_no_policy`). Acceptable only if exclusively touched by SECURITY DEFINER functions; confirm.
- **Verdict:** **Keep code. Verify config.** Highest-priority *operational* check.

## 4. Supabase Architecture Review (security)

Real, actionable hardening from security advisors:
- **9× `SECURITY DEFINER` functions executable via REST by `anon`/`authenticated`** (`handle_new_user`, `set_updated_at`, `enforce_student_limit`, `enforce_ai_report_limit`, `enforce_inquiry_rate_limit`, `enforce_rating_rate_limit`, `cleanup_old_rate_limits`, `prevent_client_plan_tampering`, `is_teacher_pro`). Trigger functions should **not** be callable as RPC. Fix: `REVOKE EXECUTE ... FROM anon, authenticated`.
- **2× `function_search_path_mutable`** (`update_teacher_search_vector`, `set_updated_at`) → add `SET search_path = ''`.
- **Verdict:** **Fix (P0).** Migration drafted (`0016_harden_function_exposure.sql`).

## 5. AI Feature Audit

- **What:** `ai-search-service.ts` — parent natural-language search ("Class 10 science tutor Civil Lines") → structured filters via OpenRouter LLM, with a **rule-based keyword fallback** when the key/LLM is absent. Plus `generate-progress-report` edge function (Gemini, server-side) for teacher report cards.
- **Useful?** Yes — NL search genuinely reduces friction for low-literacy parents; report generation saves teacher time. Both map to core flows.
- **Cost control:** Prod build refuses the browser OpenRouter key (`env.ts`) and routes AI server-side. Good.
- **Smell:** fallback hardcodes UP city/area lists (`gonda, lucknow, basti...`, `Civil Lines`). Heuristic, acceptable; make data-driven later.
- **Verdict:** **Keep, scoped.** Already limited to education guidance + matching. No unnecessary AI sprawl.

## 6. Payment System Review

- Razorpay test mode: `razorpay-service.ts` (client), `razorpay-webhook` + `upgrade-plan` edge functions, `plan_payment_receipts` table, `prevent_client_plan_tampering` trigger (server is source of truth for plan). Secret server-side only.
- **Per brief: leave untouched.** Architecture is already safe to defer.
- **Verdict:** **Keep as-is.** Do not prioritize.

## 7. Core Feature Stability Audit

| Feature | State | Notes |
|---|---|---|
| Register / Login (phone/email/Google) | Working (code) | Verify phone OTP provider config |
| Teacher search + filters | Working | AI + rule fallback; `lib/queries/teachers.ts` |
| Teacher / parent profiles | Working | profile-setup, teacher-profile, parent-profile pages |
| Contact teacher (WhatsApp) | Working | `wa.me` deep link |
| Inquiries / messages | Working | `parent_inquiries`, inquiries/messages pages, rate-limited |
| Ratings | Working | `parent_ratings`, migration 0014 surfaces submitted ratings |
| Students / batches / attendance / fees | Working | teacher-side CRM, offline-queued |
| Reports (AI) | Working | edge function + manual template fallback |
| Notifications | Working | local notifications + panel |
| PWA install / offline | Working | install-prompt, offline.html, mutation queue |
| PWA update | Partial | flow exists; **no periodic poll** (gap) |
- **No broken core features found in code.** Blocker is *zero data + unverified phone-OTP provider*, not bugs.

## 8. PWA Update System

- **Implemented:** `sw.js` busts cache per deploy (build-hash `SW_VERSION`), never caches Supabase/Razorpay/auth/api. `use-sw-update.ts` detects waiting worker; `sw-update-toast.tsx` shows "Update available"; `applyUpdate` posts `SKIP_WAITING`; `controllerchange` reloads. **Correct pattern.**
- **Real gap:** registration happens once on load; there is **no periodic `registration.update()`** call. A long-open installed PWA will not notice a new deploy until reopened. **Fix:** poll `reg.update()` on an interval + on `visibilitychange`.
- **Verdict:** **Fix (P1).** Implemented in `service-worker-register.ts`.

## 9. WhatsApp Integration Audit

- `utils/whatsapp.ts`: `buildWhatsAppLink` (parent → teacher inquiry) and `buildFeeReminderLink` (teacher → parent fees). Pre-filled Hinglish messages, `encodeURIComponent`, returns `null` on invalid phone. `share-profile.tsx` for profile sharing.
- **Delivery model:** click-to-chat (`wa.me`) — opens WhatsApp with prefilled text; user taps send. This is the correct no-cost approach pre-revenue. There is no Business API auto-send, and that is fine.
- **Gap:** `isValidPhone` only accepts India formats (10-digit or `91`+10). Acceptable for the target market; document it.
- **Verdict:** **Keep.** Working as designed. No broken integration found.

## 10. Cleanup Report

Candidates (low-risk, to confirm before delete):
- `src/assets/react.svg` — default Vite asset, likely unused.
- `scripts/test-production.js`, `scripts/test-marketplace-production.js`, `scripts/capture-screenshots.mjs` — dev/QA scripts; keep in repo, exclude from ship.
- `supabase/.temp/*` — CLI cache; should be git-ignored (verify `.gitignore`).
- Duplicate keepalive scripts: `supabase-keepalive.mjs` **and** `.ps1` — keep one per deploy target.
- `react-router-dom` listed in deps — confirm it is the import source in `router.tsx` (grep was inconclusive); if app uses `react-router` v7 directly, dedupe.
- **No large dead-code clusters found.** Cleanup is light.

## 11. Codebase Simplification

- Already junior-readable. Suggestions, not mandates: (a) co-locate the few `src/lib/*` marketplace helpers under `features/marketplace`; (b) make AI-search city/subject lists data-driven; (c) add a short `ARCHITECTURE.md`. No over-engineering to unwind.

## 12. Performance

- `dist` = **1.1 MB** total. Largest chunks: react-vendor 229 KB, supabase 167 KB, app index 111 KB; routes lazy-loaded (11–13 KB each). Healthy. Manual chunking configured in `vite.config.ts`.
- DB perf: address `auth_rls_initplan` (wrap `auth.uid()` as `(select auth.uid())`) and consolidate permissive policies **before** scale. Drop unused indexes only after real traffic confirms they stay unused.
- **Verdict:** No perf emergency. RLS tuning is the only pre-scale item.

---

## 13. Production Readiness — Overall

**Status: ~80% ready. Not a prototype — a near-launch app with a thin gap list.**

**Blockers to launch (operational, not code):**
1. Verify/secure phone-OTP provider in Supabase (Section 3). ← most important.
2. Apply DB function-exposure hardening migration (Section 4, P0).

**Should-fix before/at launch:**
3. PWA periodic update poll (Section 8, P1).
4. RLS `initplan` perf tuning (Section 12, P2 — before scale).
5. Confirm `rate_limit_log` access path (Section 3).

**Nice-to-have:** light cleanup (Section 10), data-driven AI lists (Section 5/11).

See `REFACTOR-PLAN.md` for the prioritized, sequenced execution plan.
