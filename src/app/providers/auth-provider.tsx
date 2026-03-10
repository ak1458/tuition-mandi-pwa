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
import type { AppSession, AuthContextValue, AuthMethod } from '@/types/auth'
import { hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const AUTH_METHOD_KEY = 'takhti_auth_method'
const LOCAL_SESSION_KEY = 'takhti_local_session'
const INDIA_DIAL_CODE = '+91'
const INDIA_MOBILE_DIGITS = 10

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
        full_name: payload.fullName ?? 'Demo Teacher',
      },
    },
  }
}

function readLocalSession(): AppSession | null {
  const raw = localStorage.getItem(LOCAL_SESSION_KEY)
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
  if (!session) {
    localStorage.removeItem(LOCAL_SESSION_KEY)
    return
  }
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [authMethod, setAuthMethod] = useState<AuthMethod>(() => {
    const stored = localStorage.getItem(AUTH_METHOD_KEY)
    if (stored === 'phone_otp' || stored === 'email_password') {
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

  const verifyPhoneOtp = useCallback(async (phoneNumber: string, otpCode: string) => {
    const normalizedPhone = normalizeIndiaPhoneE164(phoneNumber)

    if (isLocalMode || !hasSupabaseConfig) {
      if (otpCode.length < 4) {
        throw new Error('OTP kam se kam 4 digits ka hona chahiye.')
      }

      const userId = `local-teacher-${normalizedPhone.replace(/\D/g, '') || 'demo'}`
      const localSession = makeLocalSession({
        id: userId,
        phone: normalizedPhone,
        fullName: 'Local Demo Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      localStorage.setItem(AUTH_METHOD_KEY, 'phone_otp')
      setAuthMethod('phone_otp')
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otpCode,
      type: 'sms',
    })

    if (error) {
      throw new Error(error.message)
    }

    localStorage.setItem(AUTH_METHOD_KEY, 'phone_otp')
    setAuthMethod('phone_otp')
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
        fullName: email.split('@')[0] || 'Local Demo Teacher',
      })
      setSession(localSession)
      writeLocalSession(localSession)
      localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
      setAuthMethod('email_password')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(error.message)
    }

    localStorage.setItem(AUTH_METHOD_KEY, 'email_password')
    setAuthMethod('email_password')
  }, [])

  const signOut = useCallback(async () => {
    if (!isLocalMode && hasSupabaseConfig) {
      await supabase.auth.signOut()
    }

    writeLocalSession(null)
    localStorage.removeItem(AUTH_METHOD_KEY)
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
      signOut,
    }),
    [authMethod, isLoading, requestPhoneOtp, session, signInWithEmailPassword, signOut, verifyPhoneOtp],
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
