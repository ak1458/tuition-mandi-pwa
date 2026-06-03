import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { hasSupabaseConfig } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'
import {
  Icon,
  IconButton,
  PageShell,
  PrimaryButton,
  TuitionMandiLogo,
} from '@/components/common/tuition-mandi-ui'

const PASSWORD_MIN_LENGTH = 8

/**
 * Password reset page.
 *
 * Two modes:
 * 1. User lands here via /auth/reset-password after clicking the email link.
 *    Supabase sets the recovery session automatically via `detectSessionInUrl`.
 *    We then show the "new password" form.
 *
 * 2. User lands here without a valid recovery hash (link expired, opened in
 *    another browser, etc.). We detect the absence of a session and show a
 *    "link invalid — request a new one" UI instead of a confusing
 *    "Auth session missing" error mid-submit.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  // 'checking' = looking for recovery session; 'valid' = ready to set new pw;
  // 'invalid' = no session, show the "link invalid" CTA.
  const [linkState, setLinkState] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!hasSupabaseConfig) {
        if (!cancelled) setLinkState('invalid')
        return
      }

      // Supabase exchanges the URL hash for a session in the background.
      // Give it a moment, then read it.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        setLinkState('valid')
      } else {
        // Subscribe briefly in case detectSessionInUrl is mid-flight.
        const subscription = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (!cancelled) setLinkState('valid')
          }
        })
        // Timeout after 1.5s — if no session showed up, link is bad.
        window.setTimeout(() => {
          if (!cancelled && linkState === 'checking') {
            setLinkState('invalid')
          }
          subscription.data.subscription.unsubscribe()
        }, 1500)
      }
    }

    check().catch(() => {
      if (!cancelled) setLinkState('invalid')
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage(`Password kam se kam ${PASSWORD_MIN_LENGTH} characters ka hona chahiye.`)
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Dono passwords match nahi kar rahe.')
      return
    }

    setIsSubmitting(true)
    try {
      await updatePassword(newPassword)
      setSuccess(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password update nahi ho paya.'
      // Supabase commonly returns "Auth session missing!" when the link was
      // already consumed or expired. Map to a friendlier UI state.
      if (/auth session/i.test(message)) {
        setLinkState('invalid')
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell>
      <section className="min-h-screen px-5 pb-6 pt-5">
        <div className="flex items-start">
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate('/login')}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        </div>

        <div className="mt-4">
          <TuitionMandiLogo tagline="Your Digital Register" />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-[24px] font-black leading-tight text-[#1d1813]">
            {success
              ? 'Password Updated!'
              : linkState === 'invalid'
              ? 'Link Expired'
              : 'Reset Password'}
          </h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-6 text-[#5d544c]">
            {success
              ? 'Aapka password badal diya gaya hai. Ab login karein.'
              : linkState === 'invalid'
              ? 'Yeh password reset link ab valid nahi hai. Naya link request karein.'
              : linkState === 'checking'
              ? 'Link verify ho raha hai...'
              : 'Naya password set karein.'}
          </p>
        </div>

        <section className="mt-6 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_32px_rgba(53,38,22,0.07)]">
          {success ? (
            <div className="space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf7ef] text-[#0d7b51]">
                <Icon className="h-8 w-8" name="check" />
              </div>
              <p className="text-center text-sm font-bold text-[#0d7b51]">
                Password successfully updated.
              </p>
              <PrimaryButton onClick={() => navigate('/login', { replace: true })} type="button">
                Go to Login
              </PrimaryButton>
            </div>
          ) : linkState === 'invalid' ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0ee] text-[#d84b3f]">
                <Icon className="h-8 w-8" name="lock" />
              </div>
              <p className="text-sm font-bold text-[#d84b3f]">
                Link expired ya already use ho chuka hai.
              </p>
              <p className="text-[12px] font-semibold text-[#5d544c]">
                Login screen par ja kar &quot;Forgot password&quot; option se naya link bhejein.
              </p>
              <PrimaryButton onClick={() => navigate('/login', { replace: true })} type="button">
                Go to Login
              </PrimaryButton>
            </div>
          ) : linkState === 'checking' ? (
            <p className="py-8 text-center text-sm font-semibold text-[#746a60]">Verifying link…</p>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-[12px] font-black text-[#1d1813]" htmlFor="new-password">
                New Password
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                id="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={`Kam se kam ${PASSWORD_MIN_LENGTH} characters`}
                type="password"
                value={newPassword}
              />
              <label className="block text-[12px] font-black text-[#1d1813]" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                id="confirm-password"
                minLength={PASSWORD_MIN_LENGTH}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Password phir se dalein"
                type="password"
                value={confirmPassword}
              />

              {errorMessage && (
                <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">
                  {errorMessage}
                </p>
              )}

              <PrimaryButton disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </PrimaryButton>
            </form>
          )}
        </section>
      </section>
    </PageShell>
  )
}
