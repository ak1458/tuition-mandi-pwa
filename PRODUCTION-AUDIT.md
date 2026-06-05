# Production Readiness Audit — TuitionMandi

Date: 2026-06-05 · Branch: `fix/auth-and-dark-mode`
Method: analyzed code → verified → fixed where safe → re-built/lint → documented.

Legend: ✅ done · ⚠️ needs YOUR backend/dashboard config (can't be fixed in code) · 🔵 noted, low priority.

---

## 1. Cleanup & file organization ✅
- Heavy hero images optimized: `main_image`/`parentlogin`/`teacher` PNGs **5.1 MB → 0.64 MB** total, converted to WebP (`scripts/optimize-hero-images.mjs`); references updated; original PNGs deleted from `public/`.
- Deleted dead `src/components/common/illustrations.tsx` (~846 lines, zero imports after the photo swap).
- Removed simulation layer entirely (see §4).
- Removed local clutter outside the repo: my QA screenshots, `.playwright-mcp/`, junk `config_tmp.toml`.
- **Note:** the git repo is only `tuition-mandi/`. The parent folder (`Tuition mandi.zip`, `Tuition mandi-design/`, source PNGs, `svg/`) is NOT in the repo and never reaches GitHub. Left intact as your design reference; archive/delete at will.

## 2. Security audit ✅ (safe for public GitHub)
- **No secrets in tracked files or git history.** Scanned all commits + blobs for `sk-or-`, `SG.`, Twilio `AC…`, `rzp_live_`, `AIza…`, `sk_live_`, private keys. None found.
- Only tracked env files are `*.example` (no real values). `.env.local`, `.env.production.local`, `.env.simulation` are gitignored (`.env.*`).
- The only credential present anywhere is the **Supabase anon (publishable) key** — public by design, protected by Row-Level Security. Safe.
- `dist/` is gitignored; build output never committed.
- OpenRouter key is force-emptied in production builds (`src/lib/env.ts`) so it can never ship in the browser bundle.
- ⚠️ **Rotate the SendGrid key you pasted in chat earlier** — it's in chat history. It was never written to any file in this repo.
- 🔵 Backend security (RLS policies, provider hardening) lives in Supabase migrations `0011`–`0018`; not re-verifiable from the client. Run Supabase **Advisors** in the dashboard before launch.

## 3. Production build ✅
- `npm run build` passes (tsc + vite), no errors.
- `npm run lint` passes — **0 errors** (fixed the 3 pre-existing: `tm-kit` fast-refresh exports, `dashboard` effect-setState).
- Routes verified: all lazy-loaded pages compile; chunks emit per route. Largest app chunk 108 KB (was 122 KB before sim removal).
- 🔵 `react-vendor` 229 KB / `supabase` 167 KB are vendor chunks (expected for React 19 + supabase-js).

## 4. Simulation mode removed ✅
- Deleted `src/simulation/`, `.env.simulation`, the `dev:sim` script, the SIM banner.
- `auth-provider.tsx` and `lib/queries/teachers.ts` reverted — all sign-in goes to **real Supabase** again. No mock/bypass paths remain (`grep simulation` → 0 code refs).
- `isLocalMode = false` (hardened).

## 5. Authentication & OTP ⚠️ (code ready, needs your config)
The auth **code** is correct and production-ready. Live delivery needs dashboard config — full step-by-step in **`AUTH_SETUP_CHECKLIST.md`**. Summary:
- **Email/password** ✅ works against Supabase out of the box (enable "Confirm email" + custom SMTP for deliverability).
- **Google** ⚠️ enable the Google provider in Supabase + create a Google Cloud OAuth client. Code + friendly errors already in place.
- **Phone OTP / Twilio** ⚠️ currently gated OFF (`VITE_ENABLE_PHONE_AUTH=false`) so users never hit "provider not enabled". To turn on you need **real Twilio creds** (Account SID `AC…`, Auth Token, Messaging Service SID `MG…` or a sender number) set in Supabase Auth → Phone, then flip the flag. OTP generation/expiry/resend/rate-limit are handled by Supabase GoTrue; the app's resend cooldown (30s) and validation are wired. **The `SG.` key you gave is SendGrid (email), not Twilio — it cannot send SMS.**

## 6. Comprehensive codebase audit + fixes
- **Auth issues** ✅ fixed earlier: friendly error mapper (`lib/auth-errors.ts`), method gating, consent flow intact.
- **Dark/Light mode** ✅ migrated **22 files** off hardcoded hex onto theme tokens (`scripts/tokenize-colors.mjs`) — each mapping equals the token's light value, so **light mode is pixel-unchanged** and dark mode now adapts. Verified dark mode on welcome/login/parent screens. Dashboard hero uses the new `--hero-*` tokens.
- **Theme conflicts** ✅ centralized in `styles/tokens.css`; no component-specific theme logic remains on migrated screens.
- 🔵 **Remaining hex**: decorative SVGs in `tuition-mandi-ui.tsx` (avatars, ReportReady illustration) keep intentional fixed colors — correct, not a bug. A few saturated button backgrounds stay fixed hex (they read fine in both themes).
- **Navigation** ✅ bottom nav switches teacher/parent sets correctly; Reports surfaced via a dashboard AI card (it isn't in the nav).
- **State management** ✅ Auth/Plan contexts; no stale-closure issues found in migrated paths.
- **Performance** ✅ images optimized (biggest win); lazy routes; PWA caching. 🔵 consider `fetchpriority` on hero images later.
- **PWA update** ✅ see §9.
- **Accessibility** 🔵 icon buttons have `aria-label`; images have `alt`; theme/lang controls labelled. Follow-ups: focus-visible rings on custom buttons, color-contrast pass on washes.
- **Build warnings / runtime errors** ✅ none in build/lint. 🔵 watch console on real auth.
- **Network / API** ⚠️ depends on Supabase config (§5); error states handled with friendly messages.
- **Edge cases** ✅ empty states present (no students/leads/reports); offline fallback in SW.

## 7. Functional verification
- Verifiable now (public, no auth): welcome, teacher-login UI, parent-login, search chrome, theme switch, language switch, navigation — ✅ working, dark+light.
- ⚠️ Gated journeys (dashboard, students, attendance, fees, reports, profile setup, logout) require a **real Supabase login** — testable by you once email/Google are enabled (§5). Code paths intact; previously verified end-to-end under simulation.

## 8. Responsive ✅ (by design)
- `PageShell`/`MobileShell` constrain to `max-w-[480px]` with `overflow-x-hidden`; mobile-first layouts. No horizontal-overflow patterns found. 🔵 Recommend a final manual pass on a real tablet + PWA standalone.

## 9. PWA update experience ✅ (fixed)
- **Root cause:** a persistent "Reload" toast re-appeared on every launch/foreground until tapped.
- **Fix:** silent auto-update (`hooks/use-sw-update.ts`) — a new worker is applied automatically and the app reloads **only while backgrounded**, so users are never interrupted and just see the fresh version on return. Reload-loop guard included; toast UI removed.
- SW version is a **content hash** of the bundle (`vite.config.ts`), so identical deploys don't trigger updates. New deploys are detected (hourly + on foreground) and refresh smoothly.

## 10. Deployment readiness
| Gate | Status |
| --- | --- |
| Production build passes | ✅ |
| Lint clean | ✅ |
| Security review (code/git) | ✅ |
| No placeholder/sim content | ✅ |
| PWA stable | ✅ |
| Responsive | ✅ (design) / 🔵 manual device pass |
| Email auth | ✅ code · ⚠️ enable + SMTP |
| Google sign-in | ⚠️ your config (checklist) |
| OTP delivery | ⚠️ needs real Twilio (checklist) |

**Verdict:** code is production-ready and safe to push. Live auth (Google + OTP) is gated on your dashboard config in `AUTH_SETUP_CHECKLIST.md` — not a code defect.
