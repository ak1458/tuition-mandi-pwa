import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { colors } from '@/styles/design-tokens'

interface NavItem {
  label: string
  path: string
  icon: (active: boolean) => ReactNode
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? colors.navActive : colors.navInactive
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function StudentsIcon({ active }: { active: boolean }) {
  const color = active ? colors.navActive : colors.navInactive
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function FeesIcon({ active }: { active: boolean }) {
  const color = active ? colors.navActive : colors.navInactive
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function ReportsIcon({ active }: { active: boolean }) {
  const color = active ? colors.navActive : colors.navInactive
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function MoreIcon({ active }: { active: boolean }) {
  const color = active ? colors.navActive : colors.navInactive
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    label: 'Students',
    path: '/students',
    icon: (active) => <StudentsIcon active={active} />,
  },
  {
    label: 'Fees',
    path: '/fees',
    icon: (active) => <FeesIcon active={active} />,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: (active) => <ReportsIcon active={active} />,
  },
  {
    label: 'More',
    path: '/more',
    icon: (active) => <MoreIcon active={active} />,
  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-around bg-white border-t border-[#E0E0E0] px-2 py-1 safe-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px]"
          >
            {item.icon(isActive)}
            <span
              className="text-[11px] font-medium"
              style={{ color: isActive ? colors.navActive : colors.navInactive }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
