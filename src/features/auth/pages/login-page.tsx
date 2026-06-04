import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth, TERMS_VERSION } from '@/app/providers/auth-provider'

import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import {
  Icon,
  IconButton,
  PageShell,
  PrimaryButton,
  TuitionMandiLogo,
  cx,
} from '@/components/common/tuition-mandi-ui'
import { EducatorIllustration } from '@/components/common/illustrations'
import type { ConsentPayload } from '@/types/auth'

type LoginMode = 'phone' | 'email'
type EmailAction = 'login' | 'signup'

interface LocationState {
  from?: string
}

const OTP_RESEND_SECONDS = 30
const INDIA_DIAL_CODE = '+91'
const INDIA_MOBILE_DIGITS = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

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
  const { requestPhoneOtp, signInWithEmailPassword, signUpWithEmail, resetPassword, signInWithGoogle, verifyPhoneOtp } = useAuth()
  const { t } = useTranslation()
  const copy = useTuitionMandiCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [mode, setMode] = useState<LoginMode>('phone')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [phoneIsSignup, setPhoneIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailAction, setEmailAction] = useState<EmailAction>('login')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // DPDP / 18+ consent state — required for any new-account creation path.
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [confirmAge, setConfirmAge] = useState(false)

  const redirectTo = useMemo(() => state?.from ?? '/dashboard', [state?.from])
  const phoneNumberE164 = useMemo(() => `${INDIA_DIAL_CODE}${phoneDigits}`, [phoneDigits])

  useEffect(() => {
    if (!otpCooldown) return
    const intervalId = window.setInterval(() => {
      setOtpCooldown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [otpCooldown])

  function buildConsentPayload(): ConsentPayload {
    return {
      acceptedAt: new Date().toISOString(),
      ageVerified: confirmAge,
      termsVersion: TERMS_VERSION,
    }
  }

  function ensureConsent(): boolean {
    if (!agreeToTerms) {
      setErrorMessage('Privacy Policy aur Terms ko accept karna zaroori hai.')
      return false
    }
    if (!confirmAge) {
      setErrorMessage('Aapki umar 18 saal ya zyada honi chahiye.')
      return false
    }
    return true
  }

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

    // For first-time phone users, require consent before completing OTP verify.
    if (phoneIsSignup && !ensureConsent()) return

    setIsSubmitting(true)

    try {
      await verifyPhoneOtp(
        phoneNumberE164,
        otpCode.trim(),
        phoneIsSignup ? buildConsentPayload() : undefined,
      )
      navigate(phoneIsSignup ? '/profile/setup' : redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.otpVerifyFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Valid email address dalein (e.g. teacher@example.com)')
      return
    }

    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage(`Password kam se kam ${PASSWORD_MIN_LENGTH} characters ka hona chahiye.`)
      return
    }

    if (emailAction === 'signup' && !ensureConsent()) return

    setIsSubmitting(true)
    try {
      if (emailAction === 'signup') {
        await signUpWithEmail(trimmedEmail, password, buildConsentPayload())
        setInfoMessage('Account ban gaya! Confirmation email check karein aur link click karein.')
      } else {
        await signInWithEmailPassword(trimmedEmail, password)
        navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const trimmedEmail = forgotEmail.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Valid email address dalein.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(trimmedEmail)
      setInfoMessage(`Password reset link ${trimmedEmail} par bhej diya gaya hai. Email check karein.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Reset email nahi bhej paye.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMessage('')
    setInfoMessage('')

    setIsSubmitting(true)
    try {
      // Create a consent payload automatically on Google login, as consent is implied
      // by the text notice rendered right below the Google button.
      const consentPayload: ConsentPayload = {
        acceptedAt: new Date().toISOString(),
        ageVerified: true,
        termsVersion: TERMS_VERSION,
      }

      await signInWithGoogle(consentPayload)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.login.googleError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const showConsentBlock =
    (mode === 'email' && emailAction === 'signup' && !showForgotPassword) ||
    (mode === 'phone' && phoneIsSignup)

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
          <TuitionMandiLogo tagline={copy.brandTagline} />
        </div>

        <div className="mt-6 flex items-center justify-center py-2">
          <EducatorIllustration className="w-full max-w-[280px] xs:max-w-[320px] h-auto" />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-[24px] font-black leading-tight text-[#1c1916]">{copy.login.title}</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-6 text-[#5d544c]">
            {copy.login.subtitle}
          </p>
        </div>

        <section className="mt-5 rounded-[22px] border border-[#e5decf] bg-white p-4 shadow-[0_14px_32px_rgba(53,38,22,0.07)]">
          <div className="grid grid-cols-2 rounded-xl bg-[#f4f1ea] p-1">
            {[
              ['phone', copy.common.mobile],
              ['email', copy.common.email],
            ].map(([value, label]) => (
              <button
                className={cx(
                  'rounded-lg px-3 py-2 text-sm font-black',
                  mode === value ? 'bg-white text-[#d6850a] shadow-sm' : 'text-[#847a6c]',
                )}
                key={value}
                onClick={() => {
                  setMode(value as LoginMode)
                  setErrorMessage('')
                  setInfoMessage('')
                  setShowForgotPassword(false)
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'phone' && !otpRequested && (
            <form className="mt-4 space-y-3" onSubmit={sendOtp}>
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-black text-[#1c1916]" htmlFor="phone">
                  {copy.login.mobileNumber}
                </label>
                <label className="flex items-center gap-1 text-[10px] font-bold text-[#847a6c]">
                  <input
                    checked={phoneIsSignup}
                    className="h-3 w-3"
                    onChange={(event) => setPhoneIsSignup(event.target.checked)}
                    type="checkbox"
                  />
                  New account?
                </label>
              </div>
              <div className="flex overflow-hidden rounded-xl border border-[#e5decf] bg-[#fffdf8] focus-within:border-[#d6850a]">
                <span className="grid w-14 place-items-center border-r border-[#e5decf] text-sm font-black text-[#d6850a]">+91</span>
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
              <label className="block text-[12px] font-black text-[#1c1916]" htmlFor="otp">
                OTP
              </label>
              <input
                className="w-full rounded-xl border border-[#e5decf] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#d6850a]"
                id="otp"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="1234"
                value={otpCode}
              />

              {phoneIsSignup && <ConsentBlock
                agreeToTerms={agreeToTerms}
                setAgreeToTerms={setAgreeToTerms}
                confirmAge={confirmAge}
                setConfirmAge={setConfirmAge}
                navigate={navigate}
              />}

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl border border-[#e5decf] bg-white px-4 py-3 text-sm font-bold text-[#847a6c]"
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
                className="w-full rounded-xl border border-[#e5decf] bg-[#fffdf8] px-4 py-3 text-sm font-bold text-[#d6850a] disabled:opacity-50"
                disabled={otpCooldown > 0 || isSubmitting}
                onClick={sendOtp}
                type="button"
              >
                {otpCooldown > 0 ? copy.login.resendIn.replace('{{seconds}}', String(otpCooldown)) : copy.login.resendOtp}
              </button>
            </form>
          )}

          {mode === 'email' && !showForgotPassword && (
            <form className="mt-4 space-y-3" onSubmit={handleEmailSubmit}>
              {/* Login / Sign Up toggle */}
              <div className="grid grid-cols-2 rounded-lg bg-[#f4f1ea] p-0.5">
                {[
                  ['login', 'Login'] as const,
                  ['signup', 'Sign Up'] as const,
                ].map(([value, label]) => (
                  <button
                    className={cx(
                      'rounded-md px-3 py-1.5 text-[12px] font-black',
                      emailAction === value ? 'bg-white text-[#d6850a] shadow-sm' : 'text-[#847a6c]',
                    )}
                    key={value}
                    onClick={() => {
                      setEmailAction(value)
                      setErrorMessage('')
                      setInfoMessage('')
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <input
                autoComplete="email"
                className="w-full rounded-xl border border-[#e5decf] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#d6850a]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@example.com"
                type="email"
                value={email}
              />
              <input
                autoComplete={emailAction === 'signup' ? 'new-password' : 'current-password'}
                className="w-full rounded-xl border border-[#e5decf] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#d6850a]"
                minLength={emailAction === 'signup' ? PASSWORD_MIN_LENGTH : undefined}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={emailAction === 'signup' ? `Create password (min ${PASSWORD_MIN_LENGTH} chars)` : copy.common.password}
                type="password"
                value={password}
              />

              {emailAction === 'signup' && <ConsentBlock
                agreeToTerms={agreeToTerms}
                setAgreeToTerms={setAgreeToTerms}
                confirmAge={confirmAge}
                setConfirmAge={setConfirmAge}
                navigate={navigate}
              />}

              <PrimaryButton disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? copy.login.loginLoading
                  : emailAction === 'signup'
                  ? 'Create Account'
                  : copy.login.login}
              </PrimaryButton>

              {emailAction === 'login' && (
                <button
                  className="w-full text-center text-[12px] font-bold text-[#d6850a]"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setForgotEmail(email)
                    setErrorMessage('')
                    setInfoMessage('')
                  }}
                  type="button"
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

          {mode === 'email' && showForgotPassword && (
            <form className="mt-4 space-y-3" onSubmit={handleForgotPassword}>
              <p className="text-[12px] font-black text-[#1c1916]">Reset Password</p>
              <p className="text-[11px] font-semibold text-[#5d544c]">
                Email dalein — hum reset link bhejenge.
              </p>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-[#e5decf] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#d6850a]"
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="teacher@example.com"
                type="email"
                value={forgotEmail}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl border border-[#e5decf] bg-white px-4 py-3 text-sm font-bold text-[#847a6c]"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setErrorMessage('')
                    setInfoMessage('')
                  }}
                  type="button"
                >
                  {copy.common.back}
                </button>
                <PrimaryButton disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </PrimaryButton>
              </div>
            </form>
          )}

          {/* Google OAuth */}
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5decf] bg-white px-4 py-3 text-sm font-bold text-[#1c1916]"
            onClick={handleGoogleLogin}
            type="button"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#e5decf] text-[12px] font-black text-[#e14b36]">G</span>
            {copy.login.google}
          </button>

          {/* If user clicks Google but consent block not shown above, surface a hint */}
          {!showConsentBlock && (
            <p className="mt-2 text-center text-[10px] font-semibold text-[#847a6c]">
              Google se sign in karne par <button className="underline text-[#d6850a]" onClick={() => navigate('/privacy')} type="button">Privacy</button> aur <button className="underline text-[#d6850a]" onClick={() => navigate('/terms')} type="button">Terms</button> accept honge.
            </p>
          )}

          {infoMessage && <p className="mt-3 rounded-xl bg-[#dcf1e7] px-3 py-2 text-sm font-bold text-[#138a5e]">{infoMessage}</p>}
          {errorMessage && <p className="mt-3 rounded-xl bg-[#fbe6e1] px-3 py-2 text-sm font-bold text-[#e14b36]">{errorMessage}</p>}
        </section>

        <button
          className="mt-5 w-full text-center text-[13px] font-black text-[#138a5e]"
          onClick={() => navigate('/search')}
          type="button"
        >
          {copy.login.loginAsParent}
        </button>
      </section>
    </PageShell>
  )
}

interface ConsentBlockProps {
  agreeToTerms: boolean
  setAgreeToTerms: (next: boolean) => void
  confirmAge: boolean
  setConfirmAge: (next: boolean) => void
  navigate: (path: string) => void
}

function ConsentBlock({ agreeToTerms, setAgreeToTerms, confirmAge, setConfirmAge, navigate }: ConsentBlockProps) {
  return (
    <div className="space-y-2 rounded-xl border border-[#fcefd2] bg-[#fcefd2] p-3">
      <label className="flex items-start gap-2 text-[11px] font-semibold leading-5 text-[#5d544c]">
        <input
          checked={agreeToTerms}
          className="mt-0.5 h-4 w-4 shrink-0"
          onChange={(event) => setAgreeToTerms(event.target.checked)}
          required
          type="checkbox"
        />
        <span>
          Maine{' '}
          <button className="text-[#d6850a] underline font-bold" onClick={() => navigate('/privacy')} type="button">
            Privacy Policy
          </button>{' '}
          aur{' '}
          <button className="text-[#d6850a] underline font-bold" onClick={() => navigate('/terms')} type="button">
            Terms
          </button>{' '}
          padhi hain aur accept karta hoon.
        </span>
      </label>
      <label className="flex items-start gap-2 text-[11px] font-semibold leading-5 text-[#5d544c]">
        <input
          checked={confirmAge}
          className="mt-0.5 h-4 w-4 shrink-0"
          onChange={(event) => setConfirmAge(event.target.checked)}
          required
          type="checkbox"
        />
        <span>Meri umar 18 saal ya zyada hai aur agar main students ka data add karta hoon, toh main parent/guardian ka consent already le chuka hoon.</span>
      </label>
    </div>
  )
}
