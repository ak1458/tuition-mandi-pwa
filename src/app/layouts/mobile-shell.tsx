import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BottomNav } from '@/components/common/bottom-nav'
import { useAuth } from '@/app/providers/auth-provider'
import { InstallPrompt } from '@/features/pwa/install-prompt'
import { AnimatedLogo } from '@/components/common/animated-logo'
import { LanguageSwitcher } from '@/components/common/language-switcher'

function pageLabelKey(pathname: string) {
  if (pathname.startsWith('/attendance')) return 'nav.attendance'
  if (pathname.startsWith('/fees')) return 'nav.fees'
  if (pathname.startsWith('/reports')) return 'nav.reports'
  return 'nav.dashboard'
}

export function MobileShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const { session, authMethod, signOut } = useAuth()
  const teacherName = session?.user?.user_metadata?.full_name as string | undefined
  const greetingName = teacherName || (authMethod === 'phone_otp' ? `${t('common.teacher')} Ji` : t('common.teacher'))

  return (
    <main className="flex min-h-screen w-full flex-col bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] text-ink selection:bg-saffron selection:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md lg:px-8">
        <div className="flex items-center justify-between pb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron/90">
            {t(pageLabelKey(location.pathname))}
          </p>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={signOut}
              className="rounded-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 px-3 py-1 text-xs font-semibold text-muted shadow-sm"
              type="button"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatedLogo />
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
            {t('dashboard.greeting', { name: greetingName })}
          </h1>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-5 py-6 pb-40 lg:px-8">
        <Outlet />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-12px_26px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <InstallPrompt />
        <BottomNav />
      </div>
    </main>
  )
}
