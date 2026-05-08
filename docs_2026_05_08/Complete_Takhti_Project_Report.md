# Complete Takhti Project Report

*A consolidated single source of truth encompassing project context, technical architecture, completed phase reports, current blockers, and the phase-by-phase execution plan.*

---

## 1. Executive Summary: The Takhti Vision

**Takhti — Aapka Digital Register** is a Progressive Web App (PWA) specifically designed for the 1 crore+ private tuition teachers in India (particularly in Tier 2/3 cities like Gonda, Bahraich, Varanasi). 

**Core Problems Solved:**
1. **Attendance:** 90-second attendance tracking.
2. **Fees:** Visual dashboard for paid vs. pending fees.
3. **Communication (The "Wow" Factor):** AI-generated professional Hindi progress reports (via Google Gemini/OpenRouter) sent directly to parents on WhatsApp.

**Business Model:**
- **Free Tier:** Up to 15 students + 1 AI report preview.
- **Pro Tier:** ₹99/month or ₹799/year for unlimited students and reports. 
- **Trial:** 7 days free Pro access without a credit card.

---

## 2. Technical Architecture & Tech Stack

Following the **Vibe Coding Agent Reference**, the app is strictly built as a **Monolith** tailored for a solo developer workflow.

- **Frontend:** React + Vite + Tailwind CSS.
- **Backend/Database:** Supabase (PostgreSQL, Edge Functions, Auth, RLS).
- **Hosting:** Vercel (for frontend SPA).
- **Distribution:** Progressive Web App (PWA) — bypasses Play Store to avoid 15-30% cuts and technical friction for low-end Android devices.
- **AI Integration Hierarchy:**
  1. **Google Gemini Flash:** Primary model (excellent Hindi generation, cost-effective).
  2. **OpenRouter (DeepSeek / GLM-4):** Fallback options (implemented for local mode).
  3. **Manual Template:** Failsafe when no AI is reachable.
- **Payments:** Razorpay.

---

## 3. Completed Phases & Current State

### Phase 0-7: Foundation & Core Features (Completed)
- Folder structure, UI layouts, local data storage implementation.
- **AI & Local Mode:** OpenRouter and local storage fallback implemented for local development without Supabase configuration (`OPENROUTER_LOCAL_MODE_REPORT.md`).
- **Paywall Implementation:** Client-side paywall modal with simulated local upgrade, custom hooks (`usePlan`, `useAiReportCount`), and edge-function pre-checks (`PAYWALL_IMPLEMENTATION_REPORT.md`).

### Phase 8: PWA & Deployment Setup (Completed)
- Added `manifest.webmanifest`, SVG icons, offline fallback page, and `sw.js` for app-shell caching.
- Created deployment scripts (`deploy.ps1`, `local-server-test.ps1`).
- Configured `vercel.json` for SPA routing.

---

## 4. Recent Analysis of Blockers & Dilemmas

### Blocker 1: Razorpay Webhook Integration
**Status:** The current paywall simulates an upgrade locally. 
**Analysis:** For production, we cannot rely on client-side payment success callbacks to upgrade a user to the 'pro' plan. A server-side Supabase Edge Function must be deployed to listen to Razorpay webhooks (`payment.captured`), verify the signature, and securely update `profiles.plan='pro'` and `plan_expires_at`.

### Blocker 2: The SEO Dilemma (SPA vs SSR)
**Status:** In V2, Takhti introduces public Teacher Profiles (`/profile/:id`).
**Analysis:** As a React SPA (Vite), injecting meta tags via `useEffect` works for Googlebot but **fails entirely for WhatsApp and Facebook link previews** (which do not execute JavaScript). 
**Proposed Solution:** Since hyper-local sharing via WhatsApp/Facebook is the primary acquisition loop, we must either:
1. Implement edge-rendering for meta tags (e.g., using Vercel Edge middleware to intercept requests to `/profile/*` and inject meta tags before serving `index.html`).
2. Migrate to an SSR framework (too much refactoring).
*Recommendation:* Stick to Vite SPA but use an Edge Function/Middleware to dynamically insert OpenGraph tags for social sharing.

### Blocker 3: Remote Supabase Deployment
**Status:** Pending. 
**Analysis:** `npm run supabase:migrations:list` fails because the project is not linked to a remote Supabase instance.
**Resolution Steps Needed:** Run `npx supabase link`, push database migrations, deploy edge functions, and set secrets (`GEMINI_API_KEY`, `RAZORPAY_KEY_SECRET`).

---

## 5. V2 Marketplace & Execution Plan Moving Forward

Takhti V2 evolves the app into a **hyperlocal teacher discovery platform**.

### V2 Database Expansions (Phase A)
- `teacher_profiles`: Public profile data, location, fees, search vectors.
- `parent_ratings`: Reviews from parents (no auth required).
- `teacher_outcomes`: Verified academic results.
- `parent_inquiries`: Tracking leads.
- `profile_boosts`: Micro-transactions (₹49-99) for teachers to boost their ranking.

### Phase-by-Phase V2 Execution
1. **Phase A: Database & Security**
   - Create tables, RLS policies, and full-text search indexes (`search_vector`).
2. **Phase B: Profile Setup Wizard (`/profile/setup`)**
   - 3-step onboarding flow for teachers to input their details after signup.
3. **Phase C: Parent Search Page (`/search`)**
   - No-auth public search functionality with filters (City, Subject, Class).
4. **Phase D: Public Teacher Profile Page (`/profile/:id`)**
   - Implement the view-only profile with WhatsApp integration and address the OpenGraph/SEO dilemma for social sharing.
5. **Phase E: Rating & Inquiry System**
   - Add parent review submissions and inquiry tracking in the teacher dashboard.
6. **Phase F: Profile Boosts (Razorpay)**
   - Integrate Razorpay for micro-payments to temporarily boost search visibility.
7. **Phase G: Social Share Engineering**
   - Implement the native share API and custom Facebook sharing hooks for exponential word-of-mouth growth.

---

## 6. Actionable Next Steps

1. **Unblock Production:** Link the Supabase project, push migrations, deploy Edge Functions, and map Vercel environment variables.
2. **Resolve Payments:** Write and deploy the Razorpay Webhook Edge Function to securely handle Pro plan upgrades.
3. **Resolve SEO:** Implement a Vercel Edge Middleware snippet to dynamically inject Open Graph `<meta>` tags for `/profile/:id` routes, ensuring WhatsApp link previews work perfectly.
4. **Commence V2:** Begin Phase A (Database) from the `V2_IMPLEMENTATION_GUIDE.md`.