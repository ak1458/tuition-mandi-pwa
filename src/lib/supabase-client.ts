import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { appEnv, hasSupabaseConfig, isLocalMode } from '@/lib/env'

const isProduction = appEnv.appEnv === 'production' && !appEnv.localMode

// In production, missing Supabase config is a hard error — don't silently
// fall back to a dummy URL that produces confusing 401s.
if (isProduction && !hasSupabaseConfig) {
  console.error(
    '[takhti] FATAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in a production build. ' +
      'Set them in Vercel Environment Variables or .env.production.local.',
  )
  // Throwing here would break the bundle's top-level evaluation. We instead
  // export a proxy that throws on first use so the dev sees a loud, clear
  // failure right at the call site (and the rest of the app — public pages
  // that don't need Supabase — can still render).
}

const fallbackUrl = 'https://example.supabase.co'
const fallbackKey = 'example-anon-key'

function buildClient(): SupabaseClient {
  if (isProduction && !hasSupabaseConfig) {
    // Return a Proxy that throws on any property access so the failure surface
    // is loud and obvious at the first attempted Supabase call.
    return new Proxy({}, {
      get(_target, prop) {
        throw new Error(
          `[takhti] Supabase not configured. Tried to access supabase.${String(prop)}. ` +
            'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your production env.',
        )
      },
    }) as unknown as SupabaseClient
  }

  // In local-mode / dev with empty creds, fall back to a placeholder so the
  // app shell still mounts; isLocalMode flag is checked elsewhere before any
  // network call.
  return createClient(
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
}

export const supabase: SupabaseClient = buildClient()

// Also re-export so call sites can branch on local mode without re-importing
// from env.ts.
export { isLocalMode, hasSupabaseConfig }
