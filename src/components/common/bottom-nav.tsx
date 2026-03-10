import { NavLink } from 'react-router-dom'
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
    <nav className="grid grid-cols-5 gap-2 bg-[#fdfbf7] px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:px-6">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex min-h-14 items-center justify-center rounded-2xl border text-[12px] font-semibold tracking-wide transition-all duration-200 ${isActive
              ? 'border-saffron bg-saffron text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)]'
              : 'border-slate-200 bg-white text-muted hover:border-saffron/40 hover:text-ink'
            }`
          }
        >
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
