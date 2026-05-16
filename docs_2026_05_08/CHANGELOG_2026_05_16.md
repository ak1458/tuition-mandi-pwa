# Takhti — Audit & Hardening Changelog (May 16, 2026)

> Decisions, problems found, and what got shipped over a single audit + fix
> session. Read this top-to-bottom to onboard a teammate to the work done
> on PRs #1 and #2.
>
> **No secrets in this file.** Anything that looks like it might be a key
> goes in Vercel/Supabase dashboards per `DEPLOYMENT.md`.

---

## Session goal

> "Analyse the repo, find bugs, ship the fixes, get it ready for Vercel."

Three PRs were opened. PR #2 includes PR #1's fixes; PR #3 is reserved for
tests (deferred).

---

## PR #1 — `fix/build-errors-and-vulnerabilities`

**Why:** `npm run build` was broken on `master`; `npm audit` reported
6 vulns (3 high, 3 moderate).

**What changed:**
- Removed 9 unused imports across `reports-page.tsx` and
  `parent-profile-page.tsx` that were failing TS6133.
- Ran `npm audit fix`; resolved all 6 advisories
  (postcss XSS, vite path traversal, picomatch ReDoS, flatted prototype
  pollution, brace-expansion DoS).

**Result:**
- `npm run build` → 154 modules, 0 errors
- `npm run lint` → 0 errors
- `npm audit` → 0 vulnerabilities

---

## PR #2 — `fix/critical-bugs-and-features`

Stacked on top of PR #1. Three commits.

### Commit 1 — re-applies PR #1 fixes (so PR #2 is mergeable standalone)

### Commit 2 — `feat: working notifications, real settings, support flow, and bug fixes`

**Bugs found in audit (15 items):**

| # | What was broken |
|---|---|
| 1 | Notifications bell decorative — no `onClick`, no store, no badge |
| 2 | Settings menu items: most had `path: undefined` or wrong paths |
| 3 | Settings page had no actual settings (no notification prefs, no profile edit, no privacy, no logout confirm) |
| 4 | Help & Support was a static text page — no contact form, no FAQ, no actual support |
| 5 | Parent Profile login button had `onClick={() => {}}` — completely empty |
| 6 | Reports page was a 1500ms `setTimeout` showing fake "March_Progress_Report.pdf 1.2 MB" — no AI call |
| 7 | "Send to WhatsApp" only set a toast string; never opened WhatsApp |
| 8 | Dashboard fell back to hardcoded `\|\| 12` students, hardcoded "Anil Sharma" / "Kavita Pandey" inquiries |
| 9 | "Save profile" button just toggled local state — no persistence |
| 10 | SavedPage and MessagesPage were empty placeholder components |
| 11 | Three duplicate hook files (`usePlan.ts` / `use-plan.ts`, etc.) — camelCase wrappers with no callers |
| 12 | Dead components: `InstallPrompt`, `AnimatedBackground`, `LoginAnimatedLogo` not imported anywhere |
| 13 | No `ErrorBoundary` — any unhandled component error crashed the whole app |
| 14 | No logout confirmation — single-tap signout |
| 15 | i18n locale JSON files (~hundreds of keys) shipped but mostly unused (`useTakhtiCopy()` used instead of `t()`) |

**What got built:**

- `src/lib/notifications.ts` — per-user localStorage store; types
  `inquiry | fee | attendance | report | system`; cross-tab sync via
  `storage` event + custom `takhti:notifications:change` event.
- `src/components/common/notifications-panel.tsx` — slide-over panel with
  unread badge, dismiss, mark-all-read; `<NotificationsBell>` shows the
  badge count. Wired into Dashboard and Search.
- `src/features/settings/pages/more-page.tsx` — full rewrite. Sections:
  Profile card, Notifications (5 toggles), Privacy (phone visibility,
  visibility, security), Preferences (language), Tools, Your Data
  (JSON export, delete account), Support, Logout with `ConfirmDialog`.
- `src/features/welcome/pages/help-page.tsx` — full rewrite. WhatsApp +
  Email quick-contact tiles, real support form (persisted to
  `lib/support.ts`), 6-item FAQ accordion.
- `src/features/reports/pages/reports-page.tsx` — calls `invokeAiReport()`
  with real metrics, falls back to manual template via
  `generateManualTemplate` + `saveManualReport`, real `wa.me` link to
  guardian, copy-to-clipboard.
- `src/features/marketplace/pages/parent-profile-page.tsx` — 10-digit
  India mobile validation, persists to `takhti_parent_phone_v1`, links to
  Saved + Inquiries.
- `src/features/marketplace/pages/teacher-profile-page.tsx` — Save button
  is now a real toggle backed by `lib/saved-teachers.ts`.
- `src/features/marketplace/pages/saved-page.tsx` — real list with remove
  action, empty state.
- `src/features/marketplace/pages/messages-page.tsx` — real inquiry list
  with empty state.
- `src/features/dashboard/pages/dashboard-page.tsx` — removed all fake
  fallback numbers; real summary + real recent inquiries.
- `src/components/common/error-boundary.tsx` — global boundary wrapping
  the router; bilingual fallback ("Kuch galat ho gaya") with retry +
  reload buttons.
- `src/components/common/confirm-dialog.tsx` — reusable; used for
  Logout + Delete-account.
- New hooks (all use `useSyncExternalStore` to satisfy React 19's
  `react-hooks/set-state-in-effect`):
  - `use-notifications`
  - `use-saved-teachers`
  - `use-local-inquiries`
- New libs: `notifications`, `preferences`, `saved-teachers`, `support`.

**Cleanup (5 dead files deleted):**
- `src/hooks/usePlan.ts`
- `src/hooks/useReportCount.ts`
- `src/hooks/useStudentCount.ts`
- `src/components/common/animated-background.tsx`
- `src/components/common/login-animated-logo.tsx`

**Result after commit 2:**
- 26 files changed, +1,983 / −402
- `npm run build` → 162 modules, 0 errors
- `npm run lint` → 0 errors

### Commit 3 — `feat: production hardening — webhook, OG previews, secret discipline, runbook`

**Why:** Three production gaps remained: payment can desync, WhatsApp/FB
link previews don't work for SPA routes, and the OpenRouter key was still
plumbed into browser env.

**What got built:**

| Concern | Solution |
|---|---|
| Payment desync (user closes tab before `upgrade-plan` callback runs) | New `supabase/functions/razorpay-webhook/`. HMAC-SHA256 verifies `payment.captured` events, idempotent via `plan_payment_receipts` unique index, upserts `profiles.plan='pro'` with correct expiry (extends if already Pro). |
| `/profile/:id` had no link previews on WhatsApp/FB (they don't run JS) | New `api/og.ts` Vercel Edge Function. Fetches teacher from Supabase REST, injects `og:title/description/image` into the SPA shell. Wired in `vercel.json` rewrite. |
| OpenRouter key in browser bundle | `src/lib/env.ts`: in production builds (`VITE_APP_ENV=production && !VITE_LOCAL_MODE`) the key is force-empty and a `console.warn` fires if someone ships one. Production routes AI through Gemini Edge Function. |
| `.env.production.example` was misleading (listed `VITE_OPENROUTER_API_KEY`) | Rewrote with explicit "DO NOT SET" section listing where each secret actually goes. |
| No runbook | New `DEPLOYMENT.md`: end-to-end Supabase link/migrate/secrets/deploy, Razorpay webhook config, Vercel env vars, smoke tests, rotation cheat sheet. |

**Result:**
- 8 files changed, +680 / −11
- `npm run build` → 165 modules, 0 errors
- `npm run lint` → 0 errors

---

## Architecture decisions worth remembering

1. **Three-tier secret model** — public `VITE_*` (browser), Supabase Edge
   Function secrets (server-side AI + payment verification), Vercel-only
   (just the `/api/og` function). See the cheat sheet at the bottom of
   `DEPLOYMENT.md`.

2. **Why `useSyncExternalStore` for localStorage hooks** — React 19's
   strict `react-hooks/set-state-in-effect` rule rejects the
   `useEffect(() => setState(...))` pattern. `useSyncExternalStore` is
   the canonical replacement when state lives outside React (localStorage,
   IndexedDB, etc.).

3. **Why a webhook *and* a client callback for Razorpay** — defense in
   depth. The client callback (`upgrade-plan`) gives instant UX; the
   webhook is the source-of-truth that fires even if the user closes
   the browser. Both are idempotent on the same `payment_id` unique
   index.

4. **Why an Edge Function (not a static meta tag) for OG** — WhatsApp and
   Facebook crawlers don't run JS, and a single static `<meta og:title>`
   in `index.html` can't vary per teacher. Edge function is the cheapest
   way to get dynamic SSR-equivalent meta tags without converting the
   whole app to SSR.

5. **Why we kept the OpenRouter integration at all** — local-mode
   developers can't run Gemini Edge Function locally easily, so we still
   honour the OpenRouter key in dev. We just refuse to honour it in
   production builds.

---

## What's still open

| Item | Status | Owner |
|---|---|---|
| Connect repo to Vercel project | ❌ Not done | User (one-time dashboard step) |
| Run `npx supabase link` + `db push` | ❌ Not done | User |
| Set Edge Function secrets | ❌ Not done | User |
| Configure Razorpay webhook URL | ❌ Not done | User (after Edge Functions deployed) |
| Vitest + unit tests | ❌ Deferred | Future PR |
| Replace marketplace mock teachers with real Supabase queries | ⚠️ Already exists for non-local-mode; only mock data used in `isLocalMode` | No action needed |
| Sentry / error monitoring hookup | ❌ Deferred | Future PR (TODO comment in `error-boundary.tsx`) |

`DEPLOYMENT.md` covers steps 1–4 in detail.

---

## Final scorecard

| Category | Before audit | After PR #2 |
|---|---|---|
| `npm run build` | ❌ broken | ✅ green |
| `npm run lint` | ❌ 9 errors | ✅ 0 errors |
| `npm audit` | ❌ 6 vulns | ✅ 0 vulns |
| Notifications | ❌ decorative bell | ✅ functional with badges |
| Settings | ❌ dead links | ✅ real toggles + export + delete |
| Help/Support | ❌ static page | ✅ contact form + WhatsApp/Email + FAQ |
| AI reports | ❌ fake `setTimeout` | ✅ real Gemini call + manual fallback |
| Payment integrity | ⚠️ client-only | ✅ server-verified + webhook backstop |
| Secrets | ⚠️ OpenRouter in bundle | ✅ all server-side |
| SEO/OG | ❌ static `<title>` | ✅ Vercel Edge OG injection |
| Error handling | ❌ no boundary | ✅ ErrorBoundary + Confirm dialogs |
| Dead code | ⚠️ 5 unused files | ✅ removed |
| Tests | ❌ none | ❌ still none (deferred) |
| Deployment docs | ⚠️ scattered | ✅ DEPLOYMENT.md runbook |

---

## How this file fits in

This is a **session changelog**, not living documentation. The
authoritative sources going forward are:

- **`DEPLOYMENT.md`** — how to deploy
- **`README.md`** — how to develop
- **PRs #1 and #2** — what changed and why (with diffs)
- **Commit messages** — granular history

If something here drifts from reality in three months, trust the
code/PRs, not this file.
