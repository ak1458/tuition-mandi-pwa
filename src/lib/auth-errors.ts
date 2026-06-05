/**
 * Maps raw Supabase / GoTrue auth errors to accurate, user-friendly Hinglish
 * messages. The raw messages (e.g. "Unsupported phone provider: provider is not
 * enabled", "Invalid login credentials") are developer-facing and confusing for
 * end users, so every auth call funnels its error through `friendlyAuthError`.
 *
 * Keep the matching tolerant: GoTrue wording shifts between versions, so we match
 * on stable substrings rather than exact strings.
 */

export type AuthErrorContext = 'phone' | 'email' | 'google' | 'generic'

interface RawError {
  message?: string
  code?: string
  status?: number
}

function normalize(error: unknown): RawError {
  if (!error) return {}
  if (typeof error === 'string') return { message: error }
  if (error instanceof Error) return { message: error.message }
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>
    return {
      message: typeof e.message === 'string' ? e.message : undefined,
      code: typeof e.code === 'string' ? e.code : undefined,
      status: typeof e.status === 'number' ? e.status : undefined,
    }
  }
  return {}
}

/**
 * Returns a friendly message for an auth failure. `context` tailors the
 * "provider not enabled" copy so users know which methods actually work.
 */
export function friendlyAuthError(error: unknown, context: AuthErrorContext = 'generic'): string {
  const { message = '', status } = normalize(error)
  const lower = message.toLowerCase()

  // Provider not configured on the backend — the most common cause of the
  // reported 400 / "validation_failed" errors. Tell the user what to use instead.
  if (
    lower.includes('provider is not enabled') ||
    lower.includes('unsupported provider') ||
    lower.includes('unsupported phone provider') ||
    lower.includes('signups not allowed') ||
    lower.includes('phone_provider_disabled') ||
    lower.includes('provider_disabled')
  ) {
    if (context === 'phone') {
      return 'Mobile OTP abhi available nahi hai. Kripya Email ya Google se login karein.'
    }
    if (context === 'google') {
      return 'Google login abhi setup ho raha hai. Tab tak Email se login/sign up karein.'
    }
    return 'Yeh login method abhi available nahi hai. Email ya Google use karein.'
  }

  // Wrong email/password.
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email ya password galat hai. Dobara check karein.'
  }

  // Email not yet confirmed.
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Pehle apna email confirm karein — inbox (aur spam) mein confirmation link check karein.'
  }

  // Account already exists.
  if (lower.includes('already registered') || lower.includes('user already') || lower.includes('user_already_exists')) {
    return 'Yeh email pehle se registered hai. "Login" tab use karein.'
  }

  // OTP wrong / expired.
  if (lower.includes('token has expired') || lower.includes('otp_expired') || lower.includes('invalid otp') || lower.includes('token is invalid')) {
    return 'OTP galat ya expire ho gaya. Naya OTP mangwayein.'
  }

  // Weak password.
  if (lower.includes('password should be') || lower.includes('weak_password') || lower.includes('password is too')) {
    return 'Password kamzor hai. Kam se kam 8 characters, ek number aur ek letter rakhein.'
  }

  // Rate limited.
  if (status === 429 || lower.includes('rate limit') || lower.includes('too many') || lower.includes('over_request_rate_limit')) {
    return 'Bahut zyada attempts. Thodi der baad dobara try karein.'
  }

  // Network / fetch failure.
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Internet connection check karein aur dobara try karein.'
  }

  // Fallback: keep the original if it's already short and human-ish, else generic.
  if (message && message.length <= 120 && !lower.includes('http') && !lower.includes('{')) {
    return message
  }
  return 'Kuch galat ho gaya. Kripya dobara try karein.'
}
