import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import {
  Icon,
  IconButton,
  PageShell,
  PrimaryButton,
  TakhtiLogo,
} from '@/components/common/takhti-ui'

/**
 * Password reset page.
 *
 * Two modes:
 * 1. User lands here via /auth/reset-password after clicking the email link
 *    → Supabase sets the recovery session automatically via the hash fragment.
 *    → We show the "new password" form.
 *
 * 2. Direct navigation (shouldn't happen normally but handled gracefully).
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword.length < 6) {
      setErrorMessage('Password kam se kam 6 characters ka hona chahiye.')
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
      setErrorMessage(error instanceof Error ? error.message : 'Password update nahi ho paya.')
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
          <TakhtiLogo tagline="Your Digital Register" />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-[24px] font-black leading-tight text-[#1d1813]">
            {success ? 'Password Updated!' : 'Reset Password'}
          </h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-6 text-[#5d544c]">
            {success
              ? 'Aapka password badal diya gaya hai. Ab login karein.'
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
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-[12px] font-black text-[#1d1813]" htmlFor="new-password">
                New Password
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                id="new-password"
                minLength={6}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Kam se kam 6 characters"
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
                minLength={6}
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
