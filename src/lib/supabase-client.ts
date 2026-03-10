import { createClient } from '@supabase/supabase-js'
import { appEnv } from '@/lib/env'

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
