# Takhti — Architecture

A guide for anyone new to the codebase. Goal of the product: **help parents find tutors, and help tutors find students.** Everything here serves that.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 7 |
| UI | React 19 + TypeScript |
| Routing | `react-router` v7 |
| Styling | Tailwind CSS 3 |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| i18n | i18next (English, Hindi, Hinglish) |
| Payments | Razorpay (test mode) |
| AI | OpenRouter (dev) / Gemini via Edge Function (prod) |
| Hosting | Vercel + PWA (service worker) |

## Folder structure

```
src/
  app/            App shell, router, providers (auth, plan), route guard
  features/<x>/   One folder per domain. Each has:
    pages/          route components (the screens)
    services/       data access for that domain (calls src/lib/queries or supabase)
  components/     shared UI (common/) and marketplace widgets
  hooks/         reusable React hooks (use-plan, use-notifications, ...)
  lib/           cross-cutting logic:
    supabase-client.ts   the single Supabase client
    queries/             typed DB queries
    taxonomy.ts          subjects / classes / mediums / cities (single source of truth)
    offline/             offline mutation queue (PWA)
    demo-trial.ts        72h trial logic (derived from created_at)
  types/         shared TypeScript types
  i18n/          locale JSON + copy helpers
  styles/        Tailwind globals + design tokens

api/             Vercel serverless (og image)
supabase/
  migrations/    ordered SQL (0001 -> NNNN). Source of truth for the schema.
  functions/     Edge Functions (AI reports, razorpay webhook, plan upgrade, account deletion, data export)
public/sw.js     service worker (cache-busted per deploy)
scripts/         build + ops helpers (icons, keepalive, screenshots)
```

## Data flow

```
Page (features/x/pages)
  -> feature service (features/x/services)  OR  lib/queries
    -> supabase-client (RLS-enforced Postgres)   OR   Edge Function (server secrets)
```

- The browser only ever holds the **anon** Supabase key. Row Level Security enforces who sees what.
- Anything needing a secret (AI provider key, Razorpay secret, admin ops) runs in an **Edge Function**, never the browser. See `src/lib/env.ts`.

## Auth

`src/app/providers/auth-provider.tsx` wraps the app. Real Supabase auth — three methods:
1. Phone OTP (`signInWithOtp` / `verifyOtp`)
2. Email + password
3. Google OAuth

`src/app/route-guard.tsx` gates protected routes on the session. There is **no client-side auth bypass**; access control is RLS + the guard.

## The two core journeys

- **Parent:** register → `search-page` (AI/keyword search) → `teacher-profile-page` → contact via WhatsApp deep link / `parent_inquiries`.
- **Teacher:** register → `profile-setup-page` → receive `parent_inquiries` → manage students/batches/attendance/fees (teacher CRM) → AI progress reports.

## PWA / updates

- `public/sw.js` caches the app shell, never caches Supabase/auth/api responses, and busts its cache every deploy via a build-hash `SW_VERSION` (injected in `vite.config.ts`).
- `src/features/pwa/service-worker-register.ts` registers the SW and polls for updates (hourly + on tab focus).
- `src/hooks/use-sw-update.ts` + `sw-update-toast.tsx` show "Update available" → reload.

## How to add a feature

1. Create `src/features/<name>/{pages,services}`.
2. Add the route in `src/app/router.tsx` (lazy-load the page).
3. Put DB access in the feature's `services/` (or `src/lib/queries`), never inline in the page.
4. If it needs a new table/policy, add a migration in `supabase/migrations/` — never edit an old one.
5. Add user-facing strings to `src/i18n/locales/*`.

## Conventions

- Subjects/classes/cities come from `src/lib/taxonomy.ts`. Don't hardcode lists.
- Secrets never touch the browser bundle (`VITE_` vars are public).
- Migrations are append-only and ordered.
- Keep pages thin; push logic into services/hooks/lib.
