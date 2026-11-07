# TuitionMandi

A teacher workflow PWA for student records, attendance, fees, and progress reports, with local mode and Supabase integration.

[![React: UI](https://img.shields.io/badge/React-UI-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript: Typed](https://img.shields.io/badge/TypeScript-Typed-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase: Backend](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-64748B?style=flat-square)](LICENSE)

[Architecture](ARCHITECTURE.md) · [Deployment](DEPLOYMENT.md) · [Audit notes](PRODUCTION-AUDIT.md)

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

## License

Copyright © 2026 Ashraf Kamal. Reuse is restricted by [LICENSE](LICENSE).
