import { createClient } from '@supabase/supabase-js'
import { appEnv } from '@/lib/env'

const isProduction = appEnv.appEnv === 'production' && !appEnv.localMode

// In production, missing Supabase config is a hard error — don't silently
// fall back to a dummy URL that produces confusing 401s.
if (isProduction && (!appEnv.supabaseUrl || !appEnv.supabaseAnonKey)) {
  console.error(
    '[takhti] FATAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in a production build. ' +
      'Set them in Vercel Environment Variables or .env.production.local.',
  )
}

const fallbackUrl = 'https://example.supabase.co'
const fallbackKey = 'example-anon-key'

export const supabase = createClient(
  appEnv.supabaseUrl || fallbackUrl,
  appEnv.supabaseAnonKey || fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

