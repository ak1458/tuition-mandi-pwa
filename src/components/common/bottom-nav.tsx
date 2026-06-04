import { useLocation, useNavigate } from 'react-router'
import { Icon, type IconName, cx } from '@/components/common/tuition-mandi-ui'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'

interface NavItem {
  label: string
  path: string
  icon: IconName
}

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'Students', path: '/students', icon: 'users' },
  { label: 'Reports', path: '/reports', icon: 'report' },
  { label: 'More', path: '/more', icon: 'dots' },
]

const parentNavItems: NavItem[] = [
  { label: 'Home', path: '/search', icon: 'home' },
  { label: 'Saved', path: '/saved', icon: 'bookmark' },
  { label: 'Messages', path: '/messages', icon: 'message' },
  { label: 'Profile', path: '/profile', icon: 'users' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()

  const labels: Record<string, string> = {
    Dashboard: copy.nav.dashboard,
    Students: copy.nav.students,
    Reports: copy.nav.reports,
    More: copy.nav.more,
    Home: 'Home',
    Saved: 'Saved',
    Messages: 'Messages',
    Profile: 'Profile',
  }

  const isParentRoute = location.pathname.startsWith('/search') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/saved') || location.pathname.startsWith('/messages')
  const currentItems = isParentRoute ? parentNavItems : teacherNavItems

  return (
    <nav className="pointer-events-auto mx-auto flex max-w-[480px] items-center justify-around border-t border-[#e5decf] bg-white/95 px-2 py-1 backdrop-blur safe-bottom">
      {currentItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path) || (item.path === '/search' && location.pathname === '/search')
        return (
          <button
            className="flex min-w-[68px] flex-col items-center justify-center gap-0.5 px-2 py-1.5"
            key={item.path}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <span className={cx('grid h-8 w-8 place-items-center rounded-xl', isActive ? 'bg-[#dcf1e7] text-[#138a5e]' : 'text-[#847a6c]')}>
              <Icon className="h-5 w-5" name={item.icon} />
            </span>
            <span className={cx('text-[10px] font-black', isActive ? 'text-[#138a5e]' : 'text-[#847a6c]')}>
              {labels[item.label] ?? item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
