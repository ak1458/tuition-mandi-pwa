/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AppSession, AuthContextValue, AuthMethod, ConsentPayload } from '@/types/auth'
import { hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const AUTH_METHOD_KEY = 'takhti_auth_method'
const LOCAL_SESSION_KEY = 'takhti_local_session'
const INDIA_DIAL_CODE = '+91'
const INDIA_MOBILE_DIGITS = 10

// Bump this whenever Privacy Policy / Terms substantively change. Used to
// detect when an existing user must re-consent.
export const TERMS_VERSION = '2026-05-23'

function mapSupabaseSession(session: Session | null): AppSession | null {
  if (!session) return null
  return {
    user: {
      id: session.user.id,
      phone: session.user.phone ?? undefined,
      email: session.user.email ?? undefined,
      user_metadata: session.user.user_metadata ?? {},
    },
  }
}

function makeLocalSession(payload: { id: string; phone?: string; email?: string; fullName?: string }): AppSession {
  return {
    user: {
      id: payload.id,
      phone: payload.phone,
      email: payload.email,
      user_metadata: {
        full_name: payload.fullName ?? 'Teacher',
      },
    },
  }
}

function readLocalSession(): AppSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(LOCAL_SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AppSession
    if (parsed?.user?.id) return parsed
    return null
  } catch {
    return null
  }
}

function writeLocalSession(session: AppSession | null) {
  if (typeof window === 'undefined') return
  if (!session) {
    window.localStorage.removeItem(LOCAL_SESSION_KEY)
    return
  }
  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
}

function normalizeIndiaPhoneE164(input: string) {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('91') && digits.length > INDIA_MOBILE_DIGITS) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0') && digits.length > INDIA_MOBILE_DIGITS) {
    digits = digits.slice(1)
  }

  const nationalNumber = digits.slice(0, INDIA_MOBILE_DIGITS)

  if (nationalNumber.length !== INDIA_MOBILE_DIGITS) {
    throw new Error('10 digit Indian mobile number daliyie.')
  }

  return `${INDIA_DIAL_CODE}${nationalNumber}`
}

function buildConsentMetadata(consent: ConsentPayload | undefined) {
  if (!consent) return {}
  return {
    dpdp_consent_at: consent.acceptedAt,
    is_age_verified: consent.ageVerified ? 'true' : 'false',
    terms_version: consent.termsVersion,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [authMethod, setAuthMethod] = useState<AuthMethod>(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(AUTH_METHOD_KEY)
    if (stored === 'phone_otp' || stored === 'email_password' || stored === 'google_oauth') {
      return stored
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    const init = async () => {
      if (isLocalMode || !hasSupabaseConfig) {
        const localSession = readLocalSession()
        if (!ignore) {
          setSession(localSession)
          setIsLoading(false)
        }
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!ignore) {
        setSession(mapSupabaseSession(data.session))
        setIsLoading(false)
      }
    }

    init().catch(() => {
      if (!ignore) {
        setIsLoading(false)
      }
    })

    if (isLocalMode || !hasSupabaseConfig) {
      return () => {
        ignore = true
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(mapSupabaseSession(nextSession))
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const requestPhoneOtp = useCallback(async (phoneNumber: string) => {
    const normalizedPhone = normalizeIndiaPhoneE164(phoneNumber)

    if (isLocalMode || !hasSupabaseConfig) {
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const verifyPhoneOtp = useCallback(async (phoneNumber: string, otpCode: string, consent?: ConsentPayload) => {
    const normalizedPhone = normalizeIndiaPhoneE164(phoneNumber)

    if (isLocalMode || !hasSupabaseConfig) {
      if (otpCode.length < 4) {
        throw new Error('OTP kam se kam 4 digits ka hona chahiye.')
      }

      const userId = `local-teacher-${normalizedPhone.replace(/\D/g, '') || 'demo'}`
      const localSession = makeLocalSession({
        id: userId,
        phone: normalizedPhone,
        fullName: 'Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      window.localStorage.setItem(AUTH_METHOD_KEY, 'phone_otp')
      setAuthMethod('phone_otp')
      return
    }

    const { error, data } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otpCode,
      type: 'sms',
    })

    if (error) {
      throw new Error(error.message)
    }

    window.localStorage.setItem(AUTH_METHOD_KEY, 'phone_otp')
    setAuthMethod('phone_otp')

    // If consent was supplied (first-time signup) and the user is now signed
    // in, persist it to the profile row.
    if (consent && data.session) {
      try {
        await supabase
          .from('profiles')
          .update({
            consent_accepted_at: consent.acceptedAt,
            is_age_verified: consent.ageVerified,
            terms_version: consent.termsVersion,
          })
          .eq('id', data.session.user.id)
      } catch {
        // Non-fatal: profile may not exist yet (trigger handles it on next visit)
      }
    }
  }, [])

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (isLocalMode || !hasSupabaseConfig) {
      if (!email || !password) {
        throw new Error('Email and password required.')
      }

      const userId = `local-teacher-${email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
      const localSession = makeLocalSession({
        id: userId,
        email,
        fullName: email.split('@')[0] || 'Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      window.localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
      setAuthMethod('email_password')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(error.message)
    }

    window.localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
    setAuthMethod('email_password')
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, consent?: ConsentPayload) => {
    if (isLocalMode || !hasSupabaseConfig) {
      // In local mode, sign-up works the same as sign-in
      const userId = `local-teacher-${email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
      const localSession = makeLocalSession({
        id: userId,
        email,
        fullName: email.split('@')[0] || 'Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      window.localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
      setAuthMethod('email_password')
      return
    }

    const consentMeta = buildConsentMetadata(consent)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After confirming email, send the user to the profile setup wizard
        // (not the dashboard) — they're new and have no teacher_profile row.
        emailRedirectTo: `${origin}/profile/setup`,
        data: consentMeta,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // signUp returns a session if email confirmations are disabled,
    // otherwise the user needs to click the confirmation email link.
    // The onAuthStateChange listener will pick up the session automatically.
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (isLocalMode || !hasSupabaseConfig) {
      // In local mode, just pretend it worked
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (isLocalMode || !hasSupabaseConfig) {
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const signInWithGoogle = useCallback(async (consent?: ConsentPayload) => {
    if (isLocalMode || !hasSupabaseConfig) {
      // In local mode, create a mock Google session
      const localSession = makeLocalSession({
        id: 'local-google-user',
        email: 'google-user@takhti.local',
        fullName: 'Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      window.localStorage.setItem(AUTH_METHOD_KEY, 'google_oauth')
      setAuthMethod('google_oauth')
      return
    }

    // Remember intent BEFORE redirect — the lines after `await` may not run
    // because supabase.auth.signInWithOAuth navigates the page away.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_METHOD_KEY, 'google_oauth')
    }
    setAuthMethod('google_oauth')

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const consentMeta = buildConsentMetadata(consent)
    const queryEntries = Object.entries(consentMeta).filter(([, v]) => Boolean(v))
    const redirectQuery = queryEntries.length
      ? `?${new URLSearchParams(Object.fromEntries(queryEntries)).toString()}`
      : ''

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After OAuth, returning users go to /dashboard; new users will be
        // bounced onward to /profile/setup by RouteGuard logic if no profile.
        redirectTo: `${origin}/dashboard${redirectQuery}`,
        queryParams: {
          // Force account picker each sign-in so users can switch accounts.
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      // Roll back the optimistic localStorage write — sign-in didn't start.
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_METHOD_KEY)
      }
      setAuthMethod(null)
      throw new Error(error.message)
    }

    // The redirect happens automatically; onAuthStateChange picks up the
    // session on return.
  }, [])

  const signOut = useCallback(async () => {
    if (!isLocalMode && hasSupabaseConfig) {
      await supabase.auth.signOut()
    }

    writeLocalSession(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_METHOD_KEY)
      // Tell the service worker to drop any cached navigations / shells so
      // the next user on this device gets a clean app shell.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.active?.postMessage('SKIP_WAITING')
        }).catch(() => {})
      }
    }
    setAuthMethod(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authMethod,
      isLoading,
      requestPhoneOtp,
      verifyPhoneOtp,
      signInWithEmailPassword,
      signUpWithEmail,
      resetPassword,
      updatePassword,
      signInWithGoogle,
      signOut,
    }),
    [authMethod, isLoading, requestPhoneOtp, resetPassword, session, signInWithEmailPassword, signInWithGoogle, signOut, signUpWithEmail, updatePassword, verifyPhoneOtp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
