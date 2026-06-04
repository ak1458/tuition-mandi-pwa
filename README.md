# TuitionMandi App (Tuition Teacher PWA)

**🤖 AI CONNECTORS: Please read `AI_CONTEXT.md` in the root of this repository before proceeding! It contains the master roadmap, current state, and index of all design documents.**

Production-focused PWA for tuition teachers with:
- Phone OTP primary auth
- Attendance + fees tracking
- AI Hindi progress report generation (Supabase Edge Function)
- Offline queue for attendance/fee mutations
- Installable PWA shell

## 1) Local App Run

```bash
npm install
npm run dev:host
```

Open: `http://localhost:5173`

## 2) Environment Setup

Use `.env.local` (already configured for local mode) or copy `.env.example`:

```env
VITE_APP_ENV=development
VITE_LOCAL_MODE=true
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173
VITE_RAZORPAY_KEY=
VITE_OPENROUTER_API_KEY=...
VITE_OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001
VITE_OPENROUTER_REFERER=https://smilefotilo.com
VITE_OPENROUTER_TITLE=TuitionMandi App
```

`VITE_LOCAL_MODE=true` lets the app run without Supabase using local storage.

## 3) OpenRouter

OpenRouter direct API calls are used only in local mode (`VITE_LOCAL_MODE=true`) when `VITE_OPENROUTER_API_KEY` is set.
For production, keep `VITE_OPENROUTER_API_KEY` empty so provider credentials are not exposed in browser bundles.

## 4) Plan + Paywall

- `profiles.plan`: `free | pro`
- `profiles.plan_expires_at`: nullable timestamp
- Free plan limits:
  - Max 15 active students
  - Max 1 AI report
- Pro plan unlocks unlimited students and AI reports.
- Client-side upgrade modal + server-side enforcement both enabled.

## 5) Supabase Deployment (Later)

Install/login/link (interactive):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Push schema + deploy function:

```bash
npm run supabase:db:push
npm run supabase:functions:deploy
```

Or use helper script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 -ProjectRef YOUR_PROJECT_REF
```

Set required function secrets:

```bash
npx supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_FLASH_API_KEY RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
```

## 6) Build and Preview

```bash
npm run build
npm run preview:host
```

## 7) Local Server Smoke Test (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\local-server-test.ps1
```

## 8) Manual QA

Use project-level checklist outside this folder:
- `../MANUAL_QA_CHECKLIST_V1.md`
