import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { usePlan } from '@/hooks/use-plan'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Icon, PageHeader, PersonAvatar, cx, type IconName } from '@/components/common/takhti-ui'
import { useTakhtiCopy } from '@/i18n/takhti-copy'

const menuItems: Array<{ labelKey: 'profileVisibility' | 'parentInquiries' | 'feeSettings' | 'reminders' | 'help' | 'settings'; icon: IconName; path?: string; quiet?: boolean }> = [
  { labelKey: 'profileVisibility', icon: 'eye', path: '/profile/setup' },
  { labelKey: 'parentInquiries', icon: 'message', path: '/inquiries' },
  { labelKey: 'feeSettings', icon: 'rupee', path: '/fees', quiet: true },
  { labelKey: 'reminders', icon: 'bell', path: '/fees', quiet: true },
  { labelKey: 'help', icon: 'phone' },
  { labelKey: 'settings', icon: 'settings' },
]

export function MorePage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { isPro } = usePlan()
  const { t } = useTranslation()
  const copy = useTakhtiCopy()
  const teacherName =
    (session?.user?.user_metadata?.full_name as string | undefined) || t('common.teacher')

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-24">
      <PageHeader subtitle={copy.more.subtitle} title={copy.more.title} />

      <section className="px-4 py-4">
        <div className="rounded-[22px] border border-[#eee4d8] bg-white p-5 text-center shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
          <PersonAvatar name={teacherName} size="lg" variant="male" />
          <p className="mt-3 text-[16px] font-black text-[#1d1813]">{teacherName}</p>
          <p className="mt-1 text-[12px] font-bold text-[#746a60]">
            {isPro ? copy.more.proPlan : copy.more.freePlan}
          </p>
        </div>

        <div className="mt-4 rounded-[18px] border border-[#eee4d8] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[#1d1813]">{copy.more.language}</p>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-[#eee4d8] bg-white shadow-sm">
          {menuItems.map((item, index) => (
            <button
              className={cx(
                'flex w-full items-center gap-3 px-4 py-4 text-left',
                index < menuItems.length - 1 && 'border-b border-[#f3eadc]',
              )}
              key={item.labelKey}
              onClick={() => item.path && navigate(item.path)}
              type="button"
            >
              <span className={cx('grid h-10 w-10 place-items-center rounded-xl', item.quiet ? 'bg-[#fff4df] text-[#c87b22]' : 'bg-[#eaf7ef] text-[#0d7b51]')}>
                <Icon className="h-5 w-5" name={item.icon} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-black text-[#1d1813]">{copy.more[item.labelKey]}</span>
              <Icon className="h-4 w-4 text-[#9a8f83]" name="chevron-right" />
            </button>
          ))}
        </div>

        {!isPro && (
          <button className="mt-4 w-full rounded-xl bg-[#4930a8] py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)]" type="button">
            {copy.more.premium}
          </button>
        )}

        <button
          className="mt-3 w-full rounded-xl border border-[#eadfcd] bg-white py-3 text-sm font-bold text-[#d84b3f]"
          onClick={signOut}
          type="button"
        >
          {copy.more.logout}
        </button>
      </section>
    </div>
  )
}
