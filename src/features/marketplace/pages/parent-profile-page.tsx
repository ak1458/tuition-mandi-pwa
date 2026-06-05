import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  PageShell,
  PrimaryButton,
  TuitionMandiLogo,
} from '@/components/common/tuition-mandi-ui'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { useSavedTeachers } from '@/hooks/use-saved-teachers'

const PARENT_PHONE_KEY = 'tuition_mandi_parent_phone_v1'

export function ParentProfilePage() {
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const [phone, setPhone] = useState(() => localStorage.getItem(PARENT_PHONE_KEY) ?? '')
  const [errorMessage, setErrorMessage] = useState('')
  const savedTeachers = useSavedTeachers()

  const handleContinue = (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (digits.length !== 10) {
      setErrorMessage('10 digit ka mobile number daliyie.')
      return
    }
    localStorage.setItem(PARENT_PHONE_KEY, digits)
    navigate('/search')
  }

  return (
    <PageShell>
      <section className="min-h-full bg-paper px-5 pb-24 pt-5">
        <div className="flex items-center justify-between">
          <TuitionMandiLogo tagline="Parent Portal" />
          <LanguageSwitcher />
        </div>

        <img
          src="/parentlogin.webp"
          alt="Parent Login"
          loading="eager"
          decoding="async"
          className="mt-8 w-full max-w-[320px] mx-auto h-auto block"
        />

        <div className="mt-8 text-center">
          <h1 className="text-[22px] font-black leading-tight text-ink">Parent Login</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-relaxed text-ink-2">
            Apna mobile number daliyie. Saved teachers aur inquiries aapke device par yaad rakhe jayenge.
          </p>
        </div>

        <section className="mt-6 rounded-[24px] border border-line bg-surface p-5 shadow-md">
          <form className="space-y-4" onSubmit={handleContinue}>
            <div>
              <label className="mb-1.5 block text-[12px] font-black text-ink" htmlFor="parent-phone">
                {copy.login.mobileNumber}
              </label>
              <div className="flex overflow-hidden rounded-xl border border-line bg-surface-2 focus-within:border-marigold-deep">
                <span className="grid w-14 place-items-center border-r border-line text-sm font-black text-marigold-deep">+91</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-soft"
                  id="parent-phone"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  type="tel"
                  value={phone}
                />
              </div>
            </div>

            {errorMessage && (
              <p className="rounded-xl bg-coral-wash px-3 py-2 text-sm font-bold text-coral">{errorMessage}</p>
            )}

            <PrimaryButton type="submit">{copy.login.continueMobile}</PrimaryButton>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-line bg-surface px-3 py-3 text-sm font-bold text-marigold-deep"
                onClick={() => navigate('/saved')}
                type="button"
              >
                Saved teachers ({savedTeachers.length})
              </button>
              <button
                className="rounded-xl border border-line bg-surface px-3 py-3 text-sm font-bold text-leaf"
                onClick={() => navigate('/messages')}
                type="button"
              >
                My inquiries
              </button>
            </div>
          </form>
        </section>

        <p className="mt-8 text-center text-[11px] font-semibold text-ink-soft">
          Are you a teacher?{' '}
          <button className="font-black text-marigold-deep" onClick={() => navigate('/login')} type="button">
            Login as Teacher
          </button>
        </p>
      </section>
    </PageShell>
  )
}
