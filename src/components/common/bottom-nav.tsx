import { useLocation, useNavigate } from 'react-router'
import { Icon, type IconName, cx } from '@/components/common/tuition-mandi-ui'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { useAuth } from '@/app/providers/auth-provider'

interface NavItem {
  label: string
  path: string
  icon: IconName
}

const teacherNavItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: 'home' },
  { label: 'Leads', path: '/inquiries', icon: 'clipboard' },
  { label: 'Classes', path: '/students', icon: 'calendar' },
  { label: 'Messages', path: '/messages', icon: 'message' },
  { label: 'Profile', path: '/more', icon: 'users' },
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
  const { session } = useAuth()

  const labels: Record<string, string> = {
    Home: copy.nav.dashboard,
    Leads: 'Leads',
    Classes: 'Classes',
    Students: copy.nav.students,
    Reports: copy.nav.reports,
    More: copy.nav.more,
    Saved: 'Saved',
    Messages: 'Messages',
    Profile: 'Profile',
  }

  const currentItems = session ? teacherNavItems : parentNavItems

  return (
    <nav
      className="pointer-events-auto mx-auto flex max-w-[480px] items-center justify-around border-t px-2 py-1 backdrop-blur safe-bottom"
      style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', borderColor: 'var(--line)' }}
    >
      {currentItems.map((item) => {
        const isActive =
          location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        return (
          <button
            className="flex min-w-[60px] flex-col items-center justify-center gap-0.5 px-2 py-1.5"
            key={item.path}
            onClick={() => navigate(item.path)}
            type="button"
            style={{ color: isActive ? 'var(--ink)' : 'var(--ink-soft)' }}
          >
            <Icon className="h-[23px] w-[23px]" name={item.icon} />
            <span className={cx('text-[10.5px]', isActive ? 'font-extrabold' : 'font-semibold')}>
              {labels[item.label] ?? item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
