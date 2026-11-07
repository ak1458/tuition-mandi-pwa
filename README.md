<p align="center"><img src=".github/assets/readme-header.svg" alt="TuitionMandi — Teacher workflows · Attendance, fees &amp; progress reports" width="100%" /></p>

# TuitionMandi

TuitionMandi is a React PWA organized around tuition-teacher operations and parent-facing discovery workflows. Student and batch records, attendance, fee tracking, and report generation share the application shell. Local mode supports evaluation using browser storage; connected operation uses Supabase and Edge Functions. The distinction is essential: a local demo can show navigation and records without proving that authentication providers, plan enforcement, payment callbacks, or generated reports work in a deployed environment.

[![Stars](https://img.shields.io/github/stars/ak1458/tuition-mandi-pwa?style=flat-square)](https://github.com/ak1458/tuition-mandi-pwa/stargazers)
[![Watching](https://img.shields.io/github/watchers/ak1458/tuition-mandi-pwa?style=flat-square&label=watching)](https://github.com/ak1458/tuition-mandi-pwa/watchers)
[![Forks](https://img.shields.io/github/forks/ak1458/tuition-mandi-pwa?style=flat-square)](https://github.com/ak1458/tuition-mandi-pwa/forks)
[![Activity](https://img.shields.io/github/last-commit/ak1458/tuition-mandi-pwa?style=flat-square)](https://github.com/ak1458/tuition-mandi-pwa/activity)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-64748b?style=flat-square)](LICENSE)

**[How it works](#how-it-works) · [Run locally](#run-locally) · [Configuration](#configuration) · [Commands](#development-commands) · [Versions](#versions-and-distribution) · [License](#license)**

## How it works

1. Choose local mode for an isolated preview or configure Supabase for authenticated, persistent operation.
2. Create student/batch records and use attendance and fee screens for day-to-day updates.
3. Queue supported offline mutations for synchronization when the connected data path is available.
4. Generate progress reports through configured functions and verify account/plan/payment flows independently before launch.

## Architecture

| Path | Purpose |
| --- | --- |
| [src/app/](<src/app/>) | Providers, application layout, authentication, and routing. |
| [src/features/](<src/features/>) | Students, batches, attendance, fees, reports, marketplace, and settings. |
| [supabase/functions/](<supabase/functions/>) | Report generation, plan upgrades, payment webhook, export, and account deletion. |
| [supabase/](<supabase/>) | Database configuration and migrations. |
| [public/](<public/>) | PWA shell, icons, and offline assets. |
| [scripts/](<scripts/>) | Local smoke checks and deployment helpers. |

## What is here

- Student, batch, attendance, and fee workflows.
- Offline mutation queues and installable PWA assets.
- English/Hindi localization and teacher/parent marketplace screens.
- Supabase functions for progress reports, plan upgrades, exports, and account deletion.

## Run locally

```bash
git clone https://github.com/ak1458/tuition-mandi-pwa.git
cd tuition-mandi-pwa
npm ci
cp .env.example .env.local
npm run dev
```

Use `VITE_LOCAL_MODE=true` for local storage mode. Configure Supabase for connected operation. Keep provider secrets in server-side function configuration; `VITE_*` variables are included in browser builds, so the optional local provider key must remain empty in production.

## Engineering notes

Feature modules live in `src/features/`; authentication and routing live in `src/app/`; database and function code live in `supabase/`.

Available checks: `npm run lint` and `npm run build`. See [architecture](ARCHITECTURE.md), [deployment](DEPLOYMENT.md), and the [recorded production audit](PRODUCTION-AUDIT.md) for setup and outstanding verification. Local mode does not establish that authentication, billing, or report integrations work in a deployed environment.


## Configuration

Settings template: [.env.example](<.env.example>). Copy it to the application’s local environment file and fill only the integrations you use.

| Variable | Purpose |
| --- | --- |
| `VITE_APP_ENV` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_LOCAL_MODE` | Select local demonstration persistence versus connected operation. |
| `VITE_SUPABASE_URL` | Supabase project endpoint; use the intended development project. |
| `VITE_SUPABASE_ANON_KEY` | Publishable client key; access still depends on authentication and database policies. |
| `VITE_SUPABASE_REDIRECT_URL` | Supabase project endpoint; use the intended development project. |
| `VITE_RAZORPAY_KEY` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_ENABLE_PHONE_AUTH` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_ENABLE_GOOGLE_AUTH` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_OPENROUTER_API_KEY` | Provider credential. Keep server-side; public-prefixed legacy options must not contain production secrets. |
| `VITE_OPENROUTER_MODEL` | Model identifier used by the selected provider integration. |
| `VITE_OPENROUTER_REFERER` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_OPENROUTER_TITLE` | Optional configuration; see the linked template and its consuming module for accepted values. |

Settings template: [.env.production.example](<.env.production.example>). Copy it to the application’s local environment file and fill only the integrations you use.

| Variable | Purpose |
| --- | --- |
| `VITE_APP_ENV` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `VITE_LOCAL_MODE` | Select local demonstration persistence versus connected operation. |
| `VITE_SUPABASE_URL` | Supabase project endpoint; use the intended development project. |
| `VITE_SUPABASE_ANON_KEY` | Publishable client key; access still depends on authentication and database policies. |
| `VITE_SUPABASE_REDIRECT_URL` | Supabase project endpoint; use the intended development project. |
| `VITE_RAZORPAY_KEY` | Optional configuration; see the linked template and its consuming module for accepted values. |

Settings template: [supabase/functions/.env.example](<supabase/functions/.env.example>). Copy it to the application’s local environment file and fill only the integrations you use.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project endpoint; use the intended development project. |
| `SUPABASE_ANON_KEY` | Publishable client key; access still depends on authentication and database policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-only Supabase key; never expose in the client. |
| `GEMINI_API_KEY` | Provider credential. Keep server-side; public-prefixed legacy options must not contain production secrets. |
| `RAZORPAY_KEY_ID` | Optional configuration; see the linked template and its consuming module for accepted values. |
| `RAZORPAY_KEY_SECRET` | Provider credential. Keep server-side; public-prefixed legacy options must not contain production secrets. |
| `RAZORPAY_WEBHOOK_SECRET` | Server-only secret for validating payment webhook requests. |

Environment files and provider tokens must remain untracked. A public client prefix exposes a value in the browser bundle; it is not a safe place for privileged credentials.

## Development commands

Workspace: [package.json](<package.json>). Run these commands from its directory.

| Command | Script defined in manifest |
| --- | --- |
| `npm run dev` | `vite` |
| `npm run dev:host` | `vite --host 0.0.0.0 --port 5173` |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `eslint .` |
| `npm run preview` | `vite preview` |
| `npm run preview:host` | `vite preview --host 0.0.0.0 --port 4173` |
| `npm run supabase:db:push` | `npx supabase db push` |
| `npm run supabase:functions:deploy` | `npx supabase functions deploy generate-progress-report && npx supabase functions deploy upgrade-plan && npx supabase functions deploy razorpay-webhook && npx supabase functions deploy account-deletion && npx supabase functions deploy data-export` |
| `npm run supabase:migrations:list` | `npx supabase migration list` |

These are available commands, not a claim that all checks passed in this documentation pass. Connected checks require the services, credentials, and isolated data described above.

## Operational notes

Public VITE_* variables are bundled into the browser. Only publishable client settings belong there. The optional local OpenRouter key must remain empty in production; provider and payment secrets belong in function configuration. Set authentication redirects for the exact app URL. Local mode is useful for interface review but is not a substitute for a connected role/plan/payment test. Hindi/English content is part of the product; this README documents the project in English.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Connected login fails or returns to the wrong origin | Verify the enabled Supabase auth provider, redirect URL, and public client configuration. |
| Local records do not appear online | Local mode and Supabase operation use different persistence paths; do not assume switching modes migrates data. |
| Reports or upgrades fail | Check deployed functions, their server-side secrets, and payment webhook configuration in the intended environment. |

## Versions and distribution

Manifest versions are application/workspace metadata, not a certification of release readiness.

| Manifest | Declared version |
| --- | --- |
| [package.json](<package.json>) | `0.0.0` |

No published GitHub Release or version tag was recorded in this snapshot. The default branch is a development/source snapshot; it must not be described as a stable downloadable release merely to populate the sidebar.

GitHub Packages is a separate registry. This README does not imply that a registry package exists; use the installation path documented here rather than an invented package-install command.

## Documentation and maintenance

- [ARCHITECTURE.md](<ARCHITECTURE.md>)
- [AUTH_SETUP_CHECKLIST.md](<AUTH_SETUP_CHECKLIST.md>)
- [DEPLOYMENT.md](<DEPLOYMENT.md>)
- [PRODUCTION-AUDIT.md](<PRODUCTION-AUDIT.md>)

For change proposals, see [CONTRIBUTING.md](CONTRIBUTING.md). Include the affected workflow, reproduction steps, and relevant check output when reporting a problem. Do not include credentials or live customer data.

## License

This repository’s project code is **proprietary / all rights reserved**. Public visibility does not grant unrestricted reuse. Read [LICENSE](<LICENSE>) for the exact terms. Third-party dependencies and bundled components retain their own notices.
