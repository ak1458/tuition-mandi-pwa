import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { isLocalMode } from '@/lib/env'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTakhtiCopy } from '@/i18n/takhti-copy'
import {
  Icon,
  IconButton,
  PageShell,
  PrimaryButton,
  TakhtiLogo,
  TeacherWelcomeIllustration,
  cx,
} from '@/components/common/takhti-ui'

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
  const { requestPhoneOtp, signInWithEmailPassword, verifyPhoneOtp } = useAuth()
  const { t } = useTranslation()
  const copy = useTakhtiCopy()
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

    return () => window.clearInterval(intervalId)
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
      setInfoMessage(isLocalMode ? copy.login.demoOtp : t('login.otpSentTo', { phone: phoneNumberE164 }))
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
    <PageShell>
      <section className="min-h-screen px-5 pb-6 pt-5">
        <div className="flex items-start justify-between">
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate('/')}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
          <LanguageSwitcher />
        </div>

        <div className="mt-4">
          <TakhtiLogo tagline={copy.brandTagline} />
        </div>

        <TeacherWelcomeIllustration className="mt-6 rounded-[24px] shadow-[0_18px_38px_rgba(106,68,25,0.08)]" />

        <div className="mt-6 text-center">
          <h1 className="text-[24px] font-black leading-tight text-[#1d1813]">{copy.login.title}</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-6 text-[#5d544c]">
            {copy.login.subtitle}
          </p>
        </div>

        <section className="mt-5 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_32px_rgba(53,38,22,0.07)]">
          <div className="grid grid-cols-2 rounded-xl bg-[#fbf8f1] p-1">
            {[
              ['phone', copy.common.mobile],
              ['email', copy.common.email],
            ].map(([value, label]) => (
              <button
                className={cx(
                  'rounded-lg px-3 py-2 text-sm font-black',
                  mode === value ? 'bg-white text-[#4930a8] shadow-sm' : 'text-[#746a60]',
                )}
                key={value}
                onClick={() => {
                  setMode(value as LoginMode)
                  setErrorMessage('')
                  setInfoMessage('')
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'phone' && !otpRequested && (
            <form className="mt-4 space-y-3" onSubmit={sendOtp}>
              <label className="block text-[12px] font-black text-[#1d1813]" htmlFor="phone">
                {copy.login.mobileNumber}
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[#eadfcd] bg-[#fffdf8] focus-within:border-[#4930a8]">
                <span className="grid w-14 place-items-center border-r border-[#eadfcd] text-sm font-black text-[#4930a8]">+91</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
                  id="phone"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) => setPhoneDigits(sanitizeIndianMobileInput(event.target.value))}
                  placeholder="9876543210"
                  value={phoneDigits}
                />
              </div>
              <PrimaryButton disabled={isSubmitting} type="submit">
                {isSubmitting ? copy.login.sendingOtp : copy.login.continueMobile}
              </PrimaryButton>
            </form>
          )}

          {mode === 'phone' && otpRequested && (
            <form className="mt-4 space-y-3" onSubmit={verifyOtp}>
              <label className="block text-[12px] font-black text-[#1d1813]" htmlFor="otp">
                OTP
              </label>
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                id="otp"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="1234"
                value={otpCode}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-bold text-[#746a60]"
                  onClick={() => setOtpRequested(false)}
                  type="button"
                >
                  {copy.common.back}
                </button>
                <PrimaryButton disabled={isSubmitting} type="submit">
                  {isSubmitting ? copy.login.verifying : copy.login.login}
                </PrimaryButton>
              </div>
              <button
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-4 py-3 text-sm font-bold text-[#4930a8] disabled:opacity-50"
                disabled={otpCooldown > 0 || isSubmitting}
                onClick={sendOtp}
                type="button"
              >
                {otpCooldown > 0 ? copy.login.resendIn.replace('{{seconds}}', String(otpCooldown)) : copy.login.resendOtp}
              </button>
            </form>
          )}

          {mode === 'email' && (
            <form className="mt-4 space-y-3" onSubmit={signInWithEmail}>
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@example.com"
                type="email"
                value={email}
              />
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.common.password}
                type="password"
                value={password}
              />
              <PrimaryButton disabled={isSubmitting} type="submit">
                {isSubmitting ? copy.login.loginLoading : copy.login.login}
              </PrimaryButton>
            </form>
          )}

          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-bold text-[#1d1813]"
            onClick={async () => {
              setErrorMessage('')
              setInfoMessage('')
              setIsSubmitting(true)
              try {
                await signInWithEmailPassword('demo@takhti.local', 'demo1234')
                navigate(redirectTo, { replace: true })
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : copy.login.googleError)
              } finally {
                setIsSubmitting(false)
              }
            }}
            type="button"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#eadfcd] text-[12px] font-black text-[#d84b3f]">G</span>
            {copy.login.google}
          </button>

          {infoMessage && <p className="mt-3 rounded-xl bg-[#eaf7ef] px-3 py-2 text-sm font-bold text-[#0d7b51]">{infoMessage}</p>}
          {errorMessage && <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>}
        </section>

        <button
          className="mt-5 w-full text-center text-[13px] font-black text-[#0d7b51]"
          onClick={() => navigate('/search')}
          type="button"
        >
          {copy.login.loginAsParent}
        </button>
      </section>
    </PageShell>
  )
}
