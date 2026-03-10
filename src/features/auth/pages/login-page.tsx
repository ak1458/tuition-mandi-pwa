import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { isLocalMode } from '@/lib/env'
import { LoginAnimatedLogo } from '@/components/common/login-animated-logo'
import { LanguageSwitcher } from '@/components/common/language-switcher'

type LoginMode = 'phone' | 'email'

interface LocationState {
  from?: string
}

const OTP_RESEND_SECONDS = 30
const INDIA_DIAL_CODE = '+91'
const INDIA_MOBILE_DIGITS = 10

function sanitizeIndianMobileInput(value: string) {
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('91') && digits.length > INDIA_MOBILE_DIGITS) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0') && digits.length > INDIA_MOBILE_DIGITS) {
    digits = digits.slice(1)
  }

  return digits.slice(0, INDIA_MOBILE_DIGITS)
}

export function LoginPage() {
  const { requestPhoneOtp, verifyPhoneOtp, signInWithEmailPassword } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [mode, setMode] = useState<LoginMode>('phone')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = useMemo(() => state?.from ?? '/dashboard', [state?.from])
  const phoneNumberE164 = useMemo(() => `${INDIA_DIAL_CODE}${phoneDigits}`, [phoneDigits])

  useEffect(() => {
    if (!otpCooldown) return
    const intervalId = window.setInterval(() => {
      setOtpCooldown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [otpCooldown])

  const sendOtp = async (event?: FormEvent) => {
    event?.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    if (phoneDigits.length !== INDIA_MOBILE_DIGITS) {
      setErrorMessage(t('login.invalidPhoneIndia'))
      return
    }

    setIsSubmitting(true)
    try {
      await requestPhoneOtp(phoneNumberE164)
      setOtpRequested(true)
      setOtpCooldown(OTP_RESEND_SECONDS)
      setInfoMessage(t('login.otpSentTo', { phone: phoneNumberE164 }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.otpSendFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')
    setIsSubmitting(true)

    try {
      await verifyPhoneOtp(phoneNumberE164, otpCode.trim())
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.otpVerifyFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithEmail = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')
    setIsSubmitting(true)

    try {
      await signInWithEmailPassword(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#f7f0e3_0%,#ede3cc_60%,#e7dcc4_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-[440px] rounded-[28px] border border-[#e5dbc4] bg-white p-6 shadow-[0_20px_50px_rgba(28,27,53,0.12)]">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 flex flex-col items-center justify-center">
          <LoginAnimatedLogo className="h-16 w-auto" />
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-saffron">{t('app.name')}</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-muted">{t('login.subtitle')}</p>
        </div>

        {isLocalMode && (
          <p className="mt-4 rounded-xl bg-saffron/15 px-3 py-2 text-sm text-ink">{t('login.demoMode')}</p>
        )}

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-cream p-1">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'phone' ? 'bg-white text-ink' : 'text-muted'}`}
            onClick={() => setMode('phone')}
            type="button"
          >
            {t('login.phoneTab')}
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'email' ? 'bg-white text-ink' : 'text-muted'}`}
            onClick={() => setMode('email')}
            type="button"
          >
            {t('login.emailTab')}
          </button>
        </div>

        {mode === 'phone' && !otpRequested && (
          <form className="mt-5 space-y-3" onSubmit={sendOtp}>
            <label className="block text-sm font-semibold text-ink" htmlFor="phone">
              {t('login.phoneLabelIndia')}
            </label>
            <div className="flex w-full overflow-hidden rounded-xl border border-[#dfd4bc] bg-white outline-none ring-saffron/30 focus-within:ring">
              <span className="flex items-center border-r border-[#dfd4bc] bg-[#faf7f1] px-3 text-sm font-semibold text-ink">
                +91
              </span>
              <input
                className="w-full px-3 py-2 text-sm outline-none"
                id="phone"
                inputMode="numeric"
                maxLength={10}
                onChange={(event) => setPhoneDigits(sanitizeIndianMobileInput(event.target.value))}
                pattern="[0-9]*"
                placeholder={t('login.phonePlaceholderIndia')}
                type="tel"
                value={phoneDigits}
              />
            </div>
            <button
              className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t('login.sendingOtp') : t('login.sendOtp')}
            </button>
          </form>
        )}

        {mode === 'phone' && otpRequested && (
          <form className="mt-5 space-y-3" onSubmit={verifyOtp}>
            <p className="rounded-xl bg-cream px-3 py-2 text-xs text-muted">
              {t('login.otpSentTo', { phone: phoneNumberE164 })}
            </p>
            <label className="block text-sm font-semibold text-ink" htmlFor="otp">
              {t('login.otpLabel')}
            </label>
            <input
              className="w-full rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm outline-none ring-saffron/30 focus:ring"
              id="otp"
              maxLength={6}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder={t('login.otpPlaceholder')}
              value={otpCode}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-[#dfd4bc] px-4 py-2.5 text-sm font-semibold text-muted"
                onClick={() => setOtpRequested(false)}
                type="button"
              >
                {t('nav.back')}
              </button>
              <button
                className="rounded-xl bg-saffron px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? t('login.verifying') : t('login.verifyOtp')}
              </button>
            </div>
            <button
              className="w-full rounded-xl border border-[#dfd4bc] px-4 py-2.5 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={otpCooldown > 0 || isSubmitting}
              onClick={sendOtp}
              type="button"
            >
              {otpCooldown > 0 ? t('login.resendIn', { seconds: otpCooldown }) : t('login.resendOtp')}
            </button>
          </form>
        )}

        {mode === 'email' && (
          <form className="mt-5 space-y-3" onSubmit={signInWithEmail}>
            <label className="block text-sm font-semibold text-ink" htmlFor="email">
              {t('login.emailLabel')}
            </label>
            <input
              className="w-full rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm outline-none ring-saffron/30 focus:ring"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('login.emailPlaceholder')}
              type="email"
              value={email}
            />
            <label className="block text-sm font-semibold text-ink" htmlFor="password">
              {t('login.passwordLabel')}
            </label>
            <input
              className="w-full rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm outline-none ring-saffron/30 focus:ring"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            <button
              className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        )}

        {infoMessage && <p className="mt-4 rounded-xl bg-sage/10 px-3 py-2 text-sm text-sage">{infoMessage}</p>}
        {errorMessage && <p className="mt-4 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{errorMessage}</p>}
      </div>
    </main>
  )
}
