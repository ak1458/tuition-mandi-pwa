# AI Connector Context — TuitionMandi Project

**Date:** May 8, 2026

If you are an AI agent or connector reading this repository, this file is your entry point. It contains the high-level architecture, the current state of the application, and pointers to the detailed documentation you need to continue development.

## 1. Project Overview
**TuitionMandi — Aapka Digital Register** is a Progressive Web App (PWA) built for individual private tuition teachers in India. It handles:
- 90-second attendance tracking.
- Fee management with WhatsApp reminders.
- **Killer Feature:** AI-generated professional Hindi progress reports for parents using Google Gemini / OpenRouter.

## 2. Technical Stack
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS
- **Backend / DB:** Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **Hosting:** Vercel (for the frontend SPA)
- **AI:** OpenRouter (currently wired up for Local Mode testing) & Google Gemini via Edge Functions (planned for production).
- **Payments:** Razorpay (currently simulated locally, webhook needed for prod).
- **Architecture:** Monolith, PWA (Offline-capable with Service Worker and caching).

## 3. Current State of the Codebase (As of May 8, 2026)
- **Local Mode Perfected:** The app currently runs flawlessly in a browser sandbox using `localStorage` (`VITE_LOCAL_MODE=true`). 
- **UX Improvements Added:** 
  - WhatsApp Fee Reminders are active. 
  - The AI Report Prompt now parses real fee data and dynamically mentions pending fees, maintaining a polite, professional Hindi tone.
- **What is Pending (Blockers for Real-Life Launch):**
  1. **Supabase Integration:** The remote backend is not yet linked. You must run `npx supabase db push`, deploy edge functions, and set secrets.
  2. **Razorpay Webhook:** Currently, Pro plan upgrades are simulated on the client. A secure webhook via Supabase Edge Functions is required.
  3. **SEO / OpenGraph Dilemma:** The app is a SPA. To make WhatsApp link previews work when teachers share their profiles, an Edge Middleware or proxy is needed to inject meta tags before serving the HTML.

## 4. Essential Documentation Index
To understand the exact schemas, phase plans, and architectural decisions, read these files located in `2026-05-08_Work` and the root directories:

- `2026-05-08_Work/Complete_TuitionMandi_Project_Report.md` -> **START HERE.** The master document synthesizing all past reports, blockers, and the V2 evolution plan.
- `2026-05-08_Work/UX_IMPROVEMENTS_LOG.md` -> Details of the latest WhatsApp & AI prompt enhancements.
- `2026-05-08_Work/OPENROUTER_INTEGRATION_STATE.md` -> Explains how OpenRouter is wired up without needing a backend right now.
- `VIBE_CODING_AGENT_REFERENCE.md` -> The prompt engineering rules and terminology used to generate this codebase. Must be followed strictly to avoid hallucinations.
- `V2_IMPLEMENTATION_GUIDE.md` -> The exact SQL schemas and step-by-step features required for the V2 Marketplace (Hyperlocal Teacher Discovery).

## Instructions for the Next AI Agent
1. **Do not hallucinate features:** Stick strictly to the boundaries defined in the PRD / Complete Report.
2. **Priority:** When returning to work, the user's primary decision point is whether to fix Offline UX edge cases (Phase 3) or finally hook up the live Supabase project (Phase 1). Ask the user before writing massive amounts of code.