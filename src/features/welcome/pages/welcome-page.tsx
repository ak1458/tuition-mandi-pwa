import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { InstallPrompt } from '@/features/pwa/install-prompt'
import {
  Icon,
  PageShell,
  ThemeToggleButton,
  TuitionMandiLogo,
  cx,
} from '@/components/common/tuition-mandi-ui'

function ChoiceCard({
  tone,
  icon,
  title,
  subtitle,
  onClick,
}: {
  tone: 'parent' | 'teacher'
  icon: 'users' | 'graduation'
  title: string
  subtitle: string
  onClick: () => void
}) {
  const isParent = tone === 'parent'

  return (
    <button
      className={cx(
        'flex w-full items-center gap-4 rounded-[18px] border bg-surface p-4 text-left shadow-md active:scale-[0.99]',
        isParent ? 'border-marigold-wash' : 'border-leaf-wash',
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
          isParent ? 'bg-marigold-wash text-marigold-deep' : 'bg-leaf-wash text-leaf',
        )}
      >
        <Icon className="h-7 w-7" name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold leading-tight text-ink">{title}</span>
        <span className="mt-1 block text-[12.5px] font-medium leading-[1.45] text-ink-2">{subtitle}</span>
      </span>
      <span
        className={cx(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full',
          isParent ? 'bg-marigold-wash text-marigold-deep' : 'bg-leaf-wash text-leaf',
        )}
      >
        <Icon name="chevron-right" />
      </span>
    </button>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const copy = useTuitionMandiCopy()

  return (
    <PageShell>
      <section className="flex min-h-screen flex-col px-5 pb-6 pt-7">
        <div className="flex items-start justify-between gap-3">
          <TuitionMandiLogo tagline={copy.brandTagline} />
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggleButton />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-8">
          <h1 className="font-display max-w-[300px] text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink">
            {copy.welcome.titleBefore} <span className="text-marigold-deep">{copy.welcome.titleHighlight}</span>{' '}
            {copy.welcome.titleAfter}
          </h1>
          <p className="mt-4 max-w-[290px] text-[14px] font-medium leading-[1.55] text-ink-2">
            {copy.welcome.subtitle}
          </p>
        </div>

        <div className="my-auto flex flex-1 items-center justify-center py-4">
          <img
            src="/main_image.webp"
            alt="TuitionMandi Welcome"
            loading="eager"
            decoding="async"
            className="w-full max-w-[280px] xs:max-w-[320px] md:max-w-[360px] h-auto rounded-[24px]"
          />
        </div>

        <div className="mt-4">
          <InstallPrompt />
        </div>

        <div className="mt-auto space-y-3 pt-5">
          <ChoiceCard
            icon="users"
            onClick={() => navigate('/search')}
            subtitle={copy.welcome.parentSubtitle}
            title={copy.welcome.parentTitle}
            tone="parent"
          />
          <ChoiceCard
            icon="graduation"
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            subtitle={copy.welcome.teacherSubtitle}
            title={copy.welcome.teacherTitle}
            tone="teacher"
          />
        </div>

        <button
          className="mt-5 inline-flex items-center gap-2 self-start px-1 text-[12px] font-extrabold text-marigold-deep"
          onClick={() => navigate('/help')}
          type="button"
        >
          {copy.welcome.howItWorks}
          <Icon className="h-4 w-4" name="chevron-right" />
        </button>
      </section>
    </PageShell>
  )
}
