# Auth Setup Checklist — what YOU must configure

## ⏱ LIVE STATUS (probed against the real backend 2026-06-06)
From `GET /auth/v1/settings` on `iqcnhgwrxijxylcctlsg`:
- **Email**: `enabled` ✅ — verified: a real signup succeeded + queued a confirmation email. Email confirmation is **required** (`mailer_autoconfirm:false`).
- **Google**: `disabled` ❌ — `/authorize?provider=google` → 400. Needs the steps below + a Google Cloud OAuth client.
- **Phone**: `disabled` ❌ — but `sms_provider` is already `twilio`, so it's half-set. Needs: Twilio creds saved, a **sender**, and the **Phone toggle ON**.

### I cannot finish these from here
Enabling auth providers is a Supabase **Auth-config** action (dashboard / Management API) that my tools don't expose, and Google needs an OAuth client only you can create. So the two items below are **yours to click** — then I verify + deploy.

### Exactly what's still needed from you
1. **Google** → create OAuth client in Google Cloud, paste Client ID + Secret into Supabase (§2 below).
2. **Twilio** → in Supabase Auth → Providers → Phone:
   - Account SID: `ACe0fca…` (the one in `twillio_creds.md`) · Auth Token: from that file.
   - **Sender — MISSING:** Supabase needs a **Messaging Service SID (`MG…`)** or a **Twilio phone number** to send FROM. You gave an API Key (`SK…`) + secret, not a sender. Provide the `MG…` SID or a Twilio number.
   - Toggle **Enable Phone provider = ON**.
   - India: number/Messaging Service must be **DLT-registered** and the account **out of trial**, or SMS to real users fails.
   - When done, `/auth/v1/settings` will show `"phone":true` and I'll flip `VITE_ENABLE_PHONE_AUTH=true` + re-verify.
3. **Security (from advisor):** enable **Leaked Password Protection** (Auth → Policies) and apply migration `0019_revoke_definer_rpc_execute.sql` (`supabase db push`).
4. **Cleanup:** delete my verification user `qa.verify.9f3@gmail.com` (Auth → Users), and **delete `twillio_creds.md` + rotate the Twilio Auth Token** (it's exposed in chat/file).

---


The app code is already correct. The login errors you saw are **backend
configuration**, not bugs:

| Error you saw | Cause | Fixed by |
| --- | --- | --- |
| `Unsupported provider: provider is not enabled` (Google 400) | Google provider OFF in Supabase | Section 2 |
| `Unsupported phone provider: provider is not enabled` | No SMS provider in Supabase | Section 4 |
| Confirmation / reset emails not arriving | Default Supabase SMTP is rate-limited | Section 3 |

Supabase project ref: **`iqcnhgwrxijxylcctlsg`**
Supabase auth callback (used everywhere below):
**`https://iqcnhgwrxijxylcctlsg.supabase.co/auth/v1/callback`**

> ⚠️ **Rotate the SendGrid key you pasted in chat.** It is now in chat history =
> compromised. SendGrid → Settings → API Keys → delete it → create a new one.
> Never paste secrets in chat or commit them. None of these secrets go in the
> frontend `.env` (they live in the Supabase dashboard / Edge Function secrets).

---

## 0. URL configuration (do this first — Google + email links break without it)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production domain, e.g. `https://tuitionmandi.com`
  (or your Vercel URL `https://<project>.vercel.app`).
- **Redirect URLs** (add every one you use):
  - `http://localhost:5173/**`
  - `https://tuitionmandi.com/**`
  - `https://<your-vercel-domain>.vercel.app/**`

The app redirects to `/dashboard`, `/profile/setup`, and `/auth/reset-password`,
so the wildcard `/**` entries above cover them.

---

## 1. Email + password (already works — just verify) ✅

Supabase → **Authentication → Providers → Email**:

- [ ] **Email** provider = **Enabled**.
- [ ] Decide **Confirm email**:
  - **ON** (recommended for production) → users must click a link before login.
    The app already shows "Account ban gaya! Confirmation email check karein."
  - **OFF** → instant login after sign up (fine for testing).
- [ ] If Confirm email is ON, do **Section 3** (SMTP) or links land in spam.

Nothing else needed — email login/sign-up/reset is fully wired in code.

---

## 2. Google sign-in (you said: keep + enable)

### 2a. Google Cloud Console — create the OAuth client
<https://console.cloud.google.com> → create/select a project, then:

1. **APIs & Services → OAuth consent screen**
   - User type: **External** → fill app name (`TuitionMandi`), support email, logo.
   - Add your domain under **Authorized domains**: `tuitionmandi.com`.
   - Add scopes: `email`, `profile`, `openid` (defaults are fine).
   - Publish the app (or add yourself as a Test user while in testing).
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `https://tuitionmandi.com`
     - `https://<your-vercel-domain>.vercel.app`
   - **Authorized redirect URIs** (exactly this — Supabase's callback, not your app):
     - `https://iqcnhgwrxijxylcctlsg.supabase.co/auth/v1/callback`
   - Create → copy the **Client ID** and **Client secret**.

### 2b. Supabase — enable Google
Supabase → **Authentication → Providers → Google**:
- [ ] Toggle **Enabled**.
- [ ] Paste **Client ID** and **Client Secret** from 2a.
- [ ] Save.

### 2c. Verify
- [ ] Open the app → "Continue with Google" → should reach Google's account picker
      and return to `/dashboard`.
- Until enabled, the button now shows a friendly message instead of a raw 400.

**What I need from you:** nothing for me — this is all in your Google + Supabase
dashboards. Just confirm once it works.

---

## 3. Email deliverability via SendGrid SMTP (optional but recommended)

Your `SG.…` key is **SendGrid (email), not Twilio (SMS)**. It cannot power phone
OTP, but it is perfect as Supabase's custom SMTP so confirmation/reset emails
actually deliver.

After rotating the key (see top), Supabase → **Authentication → SMTP Settings →
Enable custom SMTP**:

- [ ] Host: `smtp.sendgrid.net`
- [ ] Port: `587`
- [ ] Username: `apikey` (literally the word `apikey`)
- [ ] Password: **your new SendGrid API key**
- [ ] Sender email: a verified SendGrid sender (e.g. `no-reply@tuitionmandi.com`)
- [ ] Sender name: `TuitionMandi`
- [ ] In SendGrid: verify the sender / domain (Settings → Sender Authentication).

**What I need from you:** nothing in code. This is dashboard-only.

---

## 4. Phone OTP / SMS (currently OFF by design)

Phone login is gated off via `VITE_ENABLE_PHONE_AUTH=false`, so the broken
"Unsupported provider" path is hidden and Email + Google are the working methods.

To turn it on later you need **real Twilio SMS credentials** (the SendGrid key
will NOT work):

1. Twilio Console → get:
   - **Account SID** (starts `AC…`)
   - **Auth Token**
   - A **Messaging Service SID** (starts `MG…`) *or* a Twilio phone number.
2. Supabase → **Authentication → Providers → Phone** → Enable → choose **Twilio**
   → paste Account SID, Auth Token, and Message Service SID / From number.
3. Set `VITE_ENABLE_PHONE_AUTH=true` in your env (Vercel + `.env.production.local`)
   and redeploy. The phone tab reappears automatically.

> Startup notes for India:
> - Twilio **free trial only sends to verified numbers** → useless for real
>   users. You must upgrade (add funds) for real traffic.
> - India SMS requires **DLT registration** (sender ID + template approval) or
>   delivery fails. MSG91 is often cheaper/easier for India if you prefer.
> - Each SMS costs money. For a free-tier startup, **Email + Google is the
>   cheaper, recommended launch path** — keep phone off until you have budget.

**What I need from you (only if/when you want SMS):** Twilio Account SID, Auth
Token, and a Messaging Service SID or Twilio number — set in Supabase, not in code.

---

## Quick "is it working?" checklist

- [ ] Section 0 URLs saved.
- [ ] Email sign-up → confirmation mail arrives (Section 1 + 3).
- [ ] Email login → reaches `/dashboard`.
- [ ] Password reset → mail arrives, link opens `/auth/reset-password`.
- [ ] Google → account picker → `/dashboard` (Section 2).
- [ ] Phone tab hidden (expected) until Section 4 is done.
