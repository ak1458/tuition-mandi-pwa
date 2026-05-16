# Takhti — 3-Day Demo Trial + Typography Pass (May 16, 2026)

> Stacked on top of PR #2. Adds the conversion-focused 3-day demo trial
> feature for new students plus a typography overhaul to fix the
> "blurry / fonts not good" issue on Android.

---

## What shipped

### Feature: Automatic 3-Day Demo Trial

Every new student added to the platform automatically enters a **72-hour
demo trial window** computed from their `created_at` timestamp. This is
purely derived state — no schema migration, no background job, no extra
data to keep in sync. The student row already has the timestamp; we just
read it.

**Where it shows up:**

| Surface | What the teacher sees |
|---|---|
| **Students list** | Students still inside their trial window get a `Demo · Xd left` pill (orange) instead of the green `Present` pill. After 72h it auto-reverts. |
| **Students list — banner** | When at least one trial is active, a soft amber "3-day demo trial active" banner explains the count. |
| **Add Student form** | A one-line hint reminding the teacher: "Every new student gets 72 hours free. Auto reverts after that." |
| **Toast on creation** | "🎁 3-day free demo trial activated for {Student}" appears for ~4s after each successful save. |
| **Attendance page** | Each row's name carries a compact `Xd left` chip if the student is still in trial. Helps teachers know which kids are "trying out". |
| **Reports / WhatsApp** | The auto-generated parent message gets a trust-building line appended: "Pehle 3 din ka free demo trial chalu hai - 2d baki." (translatable) |
| **Dashboard** | A new amber tile under "Today's Status" shows the count of students currently on the demo. Tapping it jumps to `/students`. |
| **Settings → Support** | New info row "About 3-day demo trial" so teachers can find the policy. |

**Re-render behaviour:** the badge ticks every 60 seconds via a tiny
`useMinuteTick` hook, so a "2d left" badge becomes "1d left" without the
teacher refreshing the page.

**Edge cases handled:**

- `created_at` in the future (clock skew) → treated as a fresh trial
- `created_at` invalid / missing → no badge, falls back to normal pill
- Trial expired → `getDemoTrialStatus` returns `isActive: false`, badge
  renders nothing, normal status pill resumes

### UI/UX: typography + responsive cleanup

The "blurry fonts" complaint was real — the project shipped only a system
font stack, which on Android (Pixel/Mi/Realme/etc.) renders Roboto Light
at 13-14 px without proper hinting and looks washed out. Fixed by:

1. **Inter for Latin/Roman**, **Noto Sans Devanagari for Hindi** — both
   loaded from Google Fonts with `preconnect` + `font-display: swap` so
   first paint is instant on slow 3G (no FOIT).
2. **`text-rendering: optimizeLegibility`** + `font-feature-settings:
   'cv11', 'ss01', 'kern'` — kerns small UI labels and uses Inter's
   single-storey 'a' which scans better at 11-12 px.
3. **`-webkit-font-smoothing: antialiased`** preserved + tightened
   tracking with `letter-spacing: -0.01em`.
4. **`text-wrap: balance`** on H1-H4 — no more orphan words on phones.
5. **Hindi-specific CSS branch** — when `<html lang="hi">` is set, the
   Devanagari stack is preferred so मात्रा / ligatures render properly.
6. **Focus-visible rings** — only show on keyboard nav, not mouse.
7. **`prefers-reduced-motion: reduce`** — disables the new badge ping
   animation for users who request it.
8. **Viewport meta** updated to allow `maximum-scale=5` (a11y) and
   `viewport-fit=cover` (notch handling).
9. **Animation** — added `fade-in-up` keyframe; the creation toast uses
   it so the trial confirmation feels alive.

### i18n

Three full sets of trial copy added to `src/i18n/takhti-copy.ts`:

- `demo.label` — Demo / डेमो / Demo
- `demo.activatedToast` — creation toast template
- `demo.bannerTitle` / `bannerSubtitle` — Students-page banner
- `demo.whatsappLine` — single-line trust message appended to parent
  WhatsApp messages
- `demo.dashboardCard` / `dashboardHint` — Dashboard tile
- `demo.moreSettingsTitle` / `moreSettingsHint` — Settings → Support row

---

## Files changed

| File | Why |
|---|---|
| `src/lib/demo-trial.ts` (new) | Single source of truth: `getDemoTrialStatus()`, `isInDemoTrial()`, `formatTrialRemainingShort()`, `formatTrialMessage()`, `countActiveDemoTrials()`. Pure functions, no React. |
| `src/components/common/demo-trial-badge.tsx` (new) | Reusable pill component. Re-renders every 60s via `useMinuteTick`. Two variants (`compact` / `full`). |
| `src/features/students/pages/students-page.tsx` | Replaced static "Present" pill with `<DemoTrialBadge>`. Added trial-active banner, creation toast, hint text. |
| `src/features/attendance/pages/attendance-page.tsx` | Inline trial chip beside each student name on the attendance grid. |
| `src/features/attendance/services/attendance-service.ts` | `getStudentsByBatch` now returns `created_at`. |
| `src/features/reports/pages/reports-page.tsx` | Trial line appended to WhatsApp message; chip on selected-student card. |
| `src/features/reports/services/reports-service.ts` | `listReportStudents` returns `created_at`. |
| `src/features/dashboard/pages/dashboard-page.tsx` | New amber "On free trial · N students" tile under Today's Status. |
| `src/features/settings/pages/more-page.tsx` | Info row in Support section. |
| `src/i18n/takhti-copy.ts` | `demo.*` strings in `en` / `hi` / `hi-roman`. |
| `index.html` | Inter + Noto Sans Devanagari Google Fonts, preconnect, viewport tweaks, OG description. |
| `src/styles/globals.css` | New font stacks, `optimizeLegibility`, `text-wrap: balance`, focus-visible, reduced-motion, `safe-top` utility. |
| `tailwind.config.js` | `font-body` / `font-deva` families, `fade-in-up` keyframe + animation. |

---

## Verification

```
$ npm run build
✓ built in 1.67s   (164 modules, 0 errors)

$ npm run lint
✔ 0 errors, 0 warnings
```

Bundle impact: dashboard +1.1 KB gzip, reports +0.2 KB gzip, students
+0.1 KB gzip. Negligible.

---

## Manual test steps

1. **Open `/students`** — list looks the same with crisper text.
2. **Tap Add Student** — form shows the "Every new student gets 72 hours
   free" hint. Save → toast: "🎁 3-day free demo trial activated for {name}".
3. **Look at the new student** — `Demo · 3d left` orange pill instead of
   `Present`.
4. **Open `/dashboard`** — amber tile "On free trial · 1 student" appears
   under Today's Status. Tap it → routes to `/students`.
5. **Open `/attendance`** — student row has a compact `3d left` chip
   beside their name.
6. **Open `/reports`** — pick the new student, generate a report. The
   preview now ends with: "Pehle 3 din ka free demo trial chalu hai - 3d
   baki." Tap WhatsApp → wa.me URL contains the trial line.
7. **Wait 72h (or fudge `created_at` to 4 days ago)** — all badges and
   banners disappear automatically. Trial line drops from WhatsApp text.
8. **Switch language** to हिन्दी → all trial copy renders in Devanagari
   with proper ligatures (Noto font).
9. **Reduce motion** in OS settings → ping animation on the badge
   disappears.

---

## Architecture notes worth keeping

**Why derived state and not a `students.trial_status` column?**
Because `created_at` already exists on every row and a column would
introduce a new write path that has to stay in sync (background cron, RLS
policy, etc.). The whole feature is `if (Date.now() - created < 72h)`.

**Why a 60-second tick and not 1-second?**
The badge precision is "Xd left" / "Xh left", not "X minutes Xs". 60s is
enough to get the day-rollover right and keeps the render budget
basically free.

**Why `useMinuteTick` and not `useSyncExternalStore`?**
`useSyncExternalStore` shines when external mutable state changes at
unknown times (localStorage). Here time is predictable; a setInterval +
state-updater-callback pattern (not setState-in-effect) cleanly satisfies
React 19's hooks rule without ceremony.

**Why append the trial line in `wa.me` text instead of letting the AI
generate it?**
Determinism. The Gemini Edge Function output is freeform; we want the
trial CTA to appear verbatim every time so parents recognise it.
