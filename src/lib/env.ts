/**
 * Client-side environment.
 *
 * SECURITY: anything prefixed with VITE_ ends up in the browser bundle.
 * Never put a true secret here (no service-role keys, no AI provider keys
 * in production, no Razorpay secret).
 *
 * The OpenRouter key is read here ONLY for local dev fallback. In a real
 * production build (`VITE_APP_ENV=production` or `VITE_LOCAL_MODE=false`)
 * we ignore it and route AI calls through the Supabase Edge Function
 * `generate-progress-report` instead, which uses Gemini server-side.
 */

const rawAppEnv = import.meta.env.VITE_APP_ENV ?? 'development'
const isLocalModeFlag = import.meta.env.VITE_LOCAL_MODE === 'true'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const isProductionBuild = rawAppEnv === 'production' && !isLocalModeFlag

const rawOpenRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY ?? ''
if (isProductionBuild && rawOpenRouterKey) {
  // Visible warning in browser console for any teammate who accidentally
  // ships a build with the OpenRouter key set. We refuse to honour it.
  console.warn(
    '[tuition-mandi] VITE_OPENROUTER_API_KEY is set in a production build and will be ignored. ' +
      'Move it to the Supabase Edge Function secrets (see DEPLOYMENT.md).',
  )
}

/**
 * Which auth methods to surface in the UI. Phone OTP requires a paid SMS
 * provider (Twilio/MSG91) configured in Supabase — until that exists, showing
 * the tab only produces "provider is not enabled" errors, so it is OFF by
 * default. Google requires the OAuth provider enabled in Supabase + a Google
 * Cloud OAuth client; ON by default (the button degrades to a friendly message
 * if the backend isn't ready yet). Flip these via env once configured.
 */
const phoneAuthEnabled = import.meta.env.VITE_ENABLE_PHONE_AUTH === 'true'
const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== 'false'

export const appEnv = {
  appEnv: rawAppEnv,
  localMode: isLocalModeFlag,
  supabaseUrl,
  supabaseAnonKey,
  supabaseRedirectUrl: import.meta.env.VITE_SUPABASE_REDIRECT_URL ?? '',
  razorpayKey: import.meta.env.VITE_RAZORPAY_KEY ?? '',
  phoneAuthEnabled,
  googleAuthEnabled,
  /**
   * Only honoured in dev / local-mode builds. In production this is forced empty
   * so the browser never holds the key even if someone ships it.
   */
  openRouterApiKey: isProductionBuild ? '' : rawOpenRouterKey,
  openRouterModel: import.meta.env.VITE_OPENROUTER_MODEL ?? 'qwen/qwq-32b',
  openRouterReferer: import.meta.env.VITE_OPENROUTER_REFERER ?? 'https://tuitionmandi.com',
  openRouterTitle: import.meta.env.VITE_OPENROUTER_TITLE ?? 'TuitionMandi App',
}

export const hasSupabaseConfig = Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey)
export const isPhoneAuthEnabled = appEnv.phoneAuthEnabled
export const isGoogleAuthEnabled = appEnv.googleAuthEnabled

/**
 * Hardened for production: local-storage simulation mode is disabled. The app
 * strictly relies on the remote live Supabase database.
 */
export const isLocalMode = false

