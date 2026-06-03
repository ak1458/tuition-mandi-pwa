import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useKalamCopy } from '@/i18n/kalam-copy'
import { InstallPrompt } from '@/features/pwa/install-prompt'
import {
  Icon,
  PageShell,
  TakhtiLogo,
  cx,
} from '@/components/common/takhti-ui'
import { BookLoverIllustration } from '@/components/common/illustrations'

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
        'flex w-full items-center gap-4 rounded-[18px] border p-4 text-left shadow-[0_14px_30px_rgba(53,38,22,0.08)] active:scale-[0.99]',
        isParent
          ? 'border-[#ece4f6] bg-[linear-gradient(135deg,#fff_0%,#f7f3ff_100%)]'
          : 'border-[#ddecdf] bg-[linear-gradient(135deg,#fff_0%,#f1fbf5_100%)]',
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
          isParent ? 'bg-[#eee8ff] text-[#4930a8]' : 'bg-[#e4f6ea] text-[#0d7b51]',
        )}
      >
        <Icon className="h-7 w-7" name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold leading-tight text-[#1d1813]">{title}</span>
        <span className="mt-1 block text-[12.5px] font-medium leading-[1.45] text-[#5e554c]">{subtitle}</span>
      </span>
      <span
        className={cx(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full',
          isParent ? 'bg-[#eee8ff] text-[#4930a8]' : 'bg-[#e4f6ea] text-[#0d7b51]',
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
  const copy = useKalamCopy()

  return (
    <PageShell>
      <section className="flex min-h-screen flex-col px-5 pb-6 pt-7">
        <div className="flex items-start justify-between gap-3">
          <TakhtiLogo tagline={copy.brandTagline} />
          <LanguageSwitcher />
        </div>

        <div className="mt-8">
          <h1 className="font-display max-w-[300px] text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#15120f]">
            {copy.welcome.titleBefore} <span className="text-[#4930a8]">{copy.welcome.titleHighlight}</span>{' '}
            {copy.welcome.titleAfter}
          </h1>
          <p className="mt-4 max-w-[290px] text-[14px] font-medium leading-[1.55] text-[#3a3128]">
            {copy.welcome.subtitle}
          </p>
        </div>

        <div className="my-auto flex flex-1 items-center justify-center py-4">
          <BookLoverIllustration className="w-full max-w-[280px] xs:max-w-[320px] md:max-w-[360px] h-auto" />
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
          className="mt-5 inline-flex items-center gap-2 self-start px-1 text-[12px] font-extrabold text-[#4930a8]"
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
