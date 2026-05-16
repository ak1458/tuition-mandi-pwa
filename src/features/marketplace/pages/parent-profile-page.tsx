import { useState } from 'react'
import { useNavigate } from 'react-router'
import { 
  PageShell, 
  PrimaryButton, 
  TakhtiLogo, 
  FamilyStudyIllustration
} from '@/components/common/takhti-ui'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTakhtiCopy } from '@/i18n/takhti-copy'

export function ParentProfilePage() {
  const navigate = useNavigate()
  const copy = useTakhtiCopy()
  const [phone, setPhone] = useState('')

  return (
    <PageShell>
      <section className="min-h-full bg-[#fbf8f1] px-5 pb-24 pt-5">
        <div className="flex items-center justify-between">
          <TakhtiLogo tagline="Parent Portal" />
          <LanguageSwitcher />
        </div>

        <FamilyStudyIllustration className="mt-8 rounded-[28px] shadow-[0_20px_40px_rgba(106,68,25,0.06)]" />

        <div className="mt-8 text-center">
          <h1 className="text-[22px] font-black leading-tight text-[#1d1813]">
            Parent Login
          </h1>
          <p className="mx-auto mt-2 max-w-[260px] text-[13px] font-semibold leading-relaxed text-[#5d544c]">
            Log in to view your child's progress reports and chat with trusted teachers.
          </p>
        </div>

        <section className="mt-6 rounded-[24px] border border-[#eee4d8] bg-white p-5 shadow-[0_12px_30px_rgba(53,38,22,0.05)]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-black text-[#1d1813]">
                {copy.login.mobileNumber}
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[#eadfcd] bg-[#fffdf8] focus-within:border-[#4930a8]">
                <span className="grid w-14 place-items-center border-r border-[#eadfcd] text-sm font-black text-[#4930a8]">+91</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none"
                  placeholder="9876543210"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <PrimaryButton onClick={() => {}}>
              {copy.login.continueMobile}
            </PrimaryButton>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#eadfcd]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase text-[#9a8f83]">
                <span className="bg-white px-2">Or continue with</span>
              </div>
            </div>

            <button 
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#eadfcd] bg-white py-3 text-sm font-bold text-[#1d1813] active:bg-[#fbf8f1]"
              type="button"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border border-[#eadfcd] text-[10px] font-black text-[#d84b3f]">G</span>
              {copy.login.google}
            </button>
          </div>
        </section>

        <p className="mt-8 text-center text-[11px] font-semibold text-[#9a8f83]">
          Are you a teacher? <button className="font-black text-[#4930a8]" onClick={() => navigate('/login')}>Login as Teacher</button>
        </p>
      </section>
    </PageShell>
  )
}
