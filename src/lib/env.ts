export const appEnv = {
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  localMode: import.meta.env.VITE_LOCAL_MODE === 'true',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  supabaseRedirectUrl: import.meta.env.VITE_SUPABASE_REDIRECT_URL ?? '',
  razorpayKey: import.meta.env.VITE_RAZORPAY_KEY ?? '',
  openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY ?? '',
  openRouterModel: import.meta.env.VITE_OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-lite-001',
  openRouterReferer: import.meta.env.VITE_OPENROUTER_REFERER ?? 'https://smilefotilo.com',
  openRouterTitle: import.meta.env.VITE_OPENROUTER_TITLE ?? 'Takhti App',
}

export const hasSupabaseConfig = Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey)
export const isLocalMode = appEnv.localMode || !hasSupabaseConfig
