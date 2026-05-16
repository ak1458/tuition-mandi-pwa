import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  PageShell,
  PrimaryButton,
  TakhtiLogo,
  FamilyStudyIllustration,
} from '@/components/common/takhti-ui'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTakhtiCopy } from '@/i18n/takhti-copy'
import { useSavedTeachers } from '@/hooks/use-saved-teachers'

const PARENT_PHONE_KEY = 'takhti_parent_phone_v1'

export function ParentProfilePage() {
  const navigate = useNavigate()
  const copy = useTakhtiCopy()
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
      <section className="min-h-full bg-[#fbf8f1] px-5 pb-24 pt-5">
        <div className="flex items-center justify-between">
          <TakhtiLogo tagline="Parent Portal" />
          <LanguageSwitcher />
        </div>

        <FamilyStudyIllustration className="mt-8 rounded-[28px] shadow-[0_20px_40px_rgba(106,68,25,0.06)]" />

        <div className="mt-8 text-center">
          <h1 className="text-[22px] font-black leading-tight text-[#1d1813]">Parent Login</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-relaxed text-[#5d544c]">
            Apna mobile number daliyie. Saved teachers aur inquiries aapke device par yaad rakhe jayenge.
          </p>
        </div>

        <section className="mt-6 rounded-[24px] border border-[#eee4d8] bg-white p-5 shadow-[0_12px_30px_rgba(53,38,22,0.05)]">
          <form className="space-y-4" onSubmit={handleContinue}>
            <div>
              <label className="mb-1.5 block text-[12px] font-black text-[#1d1813]" htmlFor="parent-phone">
                {copy.login.mobileNumber}
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[#eadfcd] bg-[#fffdf8] focus-within:border-[#4930a8]">
                <span className="grid w-14 place-items-center border-r border-[#eadfcd] text-sm font-black text-[#4930a8]">+91</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
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
              <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>
            )}

            <PrimaryButton type="submit">{copy.login.continueMobile}</PrimaryButton>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-[#eadfcd] bg-white px-3 py-3 text-sm font-bold text-[#4930a8]"
                onClick={() => navigate('/saved')}
                type="button"
              >
                Saved teachers ({savedTeachers.length})
              </button>
              <button
                className="rounded-xl border border-[#eadfcd] bg-white px-3 py-3 text-sm font-bold text-[#0d7b51]"
                onClick={() => navigate('/messages')}
                type="button"
              >
                My inquiries
              </button>
            </div>
          </form>
        </section>

        <p className="mt-8 text-center text-[11px] font-semibold text-[#9a8f83]">
          Are you a teacher?{' '}
          <button className="font-black text-[#4930a8]" onClick={() => navigate('/login')} type="button">
            Login as Teacher
          </button>
        </p>
      </section>
    </PageShell>
  )
}
