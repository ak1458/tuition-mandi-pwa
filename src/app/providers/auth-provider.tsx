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
import { hasSupabaseConfig } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const AUTH_METHOD_KEY = 'tuition_mandi_auth_method'
const INDIA_DIAL_CODE = '+91'
const INDIA_MOBILE_DIGITS = 10

// Bump this whenever Privacy Policy / Terms substantively change.
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

function normalizeIndiaPhoneE164(input: string) {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length > INDIA_MOBILE_DIGITS) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length > INDIA_MOBILE_DIGITS) digits = digits.slice(1)
  const national = digits.slice(0, INDIA_MOBILE_DIGITS)
  if (national.length !== INDIA_MOBILE_DIGITS) throw new Error('10 digit Indian mobile number daliyie.')
  return `${INDIA_DIAL_CODE}${national}`
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
    if (stored === 'phone_otp' || stored === 'email_password' || stored === 'google_oauth') return stored
    return null
  })
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!hasSupabaseConfig) {
      console.error('[tuition-mandi] Supabase not configured — auth disabled.')
      return
    }

    let ignore = false
    supabase.auth.getSession().then(({ data }) => {
      if (!ignore) {
        setSession(mapSupabaseSession(data.session))
        setIsLoading(false)
      }
    }).catch(() => {
      if (!ignore) setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(mapSupabaseSession(nextSession))
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const requestPhoneOtp = useCallback(async (phoneNumber: string) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const normalizedPhone = normalizeIndiaPhoneE164(phoneNumber)
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { shouldCreateUser: true },
    })
    if (error) throw new Error(error.message)
  }, [])

  const verifyPhoneOtp = useCallback(async (phoneNumber: string, otpCode: string, consent?: ConsentPayload) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const normalizedPhone = normalizeIndiaPhoneE164(phoneNumber)
    const { error, data } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otpCode,
      type: 'sms',
    })
    if (error) throw new Error(error.message)

    window.localStorage.setItem(AUTH_METHOD_KEY, 'phone_otp')
    setAuthMethod('phone_otp')

    if (consent && data.session) {
      try {
        await supabase.from('profiles').update({
          consent_accepted_at: consent.acceptedAt,
          is_age_verified: consent.ageVerified,
          terms_version: consent.termsVersion,
        }).eq('id', data.session.user.id)
      } catch {
        // Non-fatal: trigger handles profile creation on next visit
      }
    }
  }, [])

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    window.localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
    setAuthMethod('email_password')
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, consent?: ConsentPayload) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const consentMeta = buildConsentMetadata(consent)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/profile/setup`,
        data: consentMeta,
      },
    })
    if (error) throw new Error(error.message)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    })
    if (error) throw new Error(error.message)
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }, [])

  const signInWithGoogle = useCallback(async (consent?: ConsentPayload) => {
    if (!hasSupabaseConfig) throw new Error('Auth not configured.')

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
        redirectTo: `${origin}/dashboard${redirectQuery}`,
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) {
      if (typeof window !== 'undefined') window.localStorage.removeItem(AUTH_METHOD_KEY)
      setAuthMethod(null)
      throw new Error(error.message)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (hasSupabaseConfig) await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_METHOD_KEY)
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
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
