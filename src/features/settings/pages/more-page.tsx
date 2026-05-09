import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { usePlan } from '@/hooks/use-plan'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTranslation } from 'react-i18next'
import { colors } from '@/styles/design-tokens'

interface MenuItem {
  label: string
  icon: ReactNode
}

const menuItems: MenuItem[] = [
  {
    label: 'Class Details',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Fee Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Reminders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Backup & Restore',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
  {
    label: 'Help & Support',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export function MorePage() {
  const { session, signOut } = useAuth()
  const { isPro } = usePlan()
  const { t } = useTranslation()
  const teacherName =
    (session?.user?.user_metadata?.full_name as string | undefined) || t('common.teacher')

  const initials = teacherName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      {/* ── Header ── */}
      <h1 className="text-xl font-bold text-[#1A1A1A] text-center">{t('more.title')}</h1>

      {/* ── Profile Section ── */}
      <div className="rounded-xl bg-white p-4 shadow-sm text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold"
          style={{ backgroundColor: colors.primary }}
        >
          {initials}
        </div>
        <p className="mt-3 text-base font-semibold text-[#1A1A1A]">
          {teacherName}
        </p>
        <p className="text-xs text-[#757575] mt-1">
          {isPro
            ? t('more.plan.pro')
            : t('more.plan.free')}
        </p>
      </div>

      {/* ── Language Switcher ── */}
      <div className="rounded-xl bg-white p-4 shadow-sm flex items-center justify-between">
        <p className="text-sm text-[#1A1A1A] font-medium">{t('more.language')}</p>
        <LanguageSwitcher />
      </div>

      {/* ── Menu Items ── */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {menuItems.map((item, i) => {
          let labelKey = ''
          if (item.label === 'Class Details') labelKey = 'more.menu.classDetails'
          else if (item.label === 'Fee Settings') labelKey = 'more.menu.feeSettings'
          else if (item.label === 'Reminders') labelKey = 'more.menu.reminders'
          else if (item.label === 'Backup & Restore') labelKey = 'more.menu.backupRestore'
          else if (item.label === 'Help & Support') labelKey = 'more.menu.helpSupport'
          else if (item.label === 'Settings') labelKey = 'more.menu.settings'
          
          return (
            <button
              key={item.label}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${
                i < menuItems.length - 1 ? 'border-b border-[#F0F0F0]' : ''
              }`}
            >
              {item.icon}
              <span className="flex-1 text-sm text-[#1A1A1A]">{t(labelKey)}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9E9E9E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* ── Upgrade Button ── */}
      {!isPro && (
        <button
          type="button"
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#15732F]"
        >
          {t('more.buttons.upgrade')}
        </button>
      )}

      {/* ── Logout ── */}
      <button
        type="button"
        onClick={signOut}
        className="border border-[#E0E0E0] text-[#E53935] bg-white rounded-xl py-3 w-full font-semibold text-sm"
      >
        {t('more.buttons.logout')}
      </button>
    </div>
  )
}
