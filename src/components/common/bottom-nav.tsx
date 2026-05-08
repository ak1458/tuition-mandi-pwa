import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/attendance', labelKey: 'nav.attendance' },
  { to: '/fees', labelKey: 'nav.fees' },
  { to: '/reports', labelKey: 'nav.reports' },
  { to: '/inquiries', labelKey: 'nav.inquiries' },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="grid grid-cols-5 gap-0.5 bg-[#fdfbf7] px-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 sm:gap-2 sm:px-2 sm:pt-3 lg:px-6">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex min-h-10 items-center justify-center rounded-lg border text-[9px] font-semibold leading-tight tracking-wide transition-all duration-200 sm:min-h-14 sm:rounded-2xl sm:text-[12px] ${isActive
              ? 'border-saffron bg-saffron text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)]'
              : 'border-slate-200 bg-white text-muted hover:border-saffron/40 hover:text-ink'
            }`
          }
        >
          <span className="truncate px-0.5">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
