/* eslint-disable react-refresh/only-export-components */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, SVGProps } from 'react'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export type IconName =
  | 'arrow-left'
  | 'bell'
  | 'bookmark'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'chevron-right'
  | 'clipboard'
  | 'dots'
  | 'eye'
  | 'filter'
  | 'graduation'
  | 'heart'
  | 'home'
  | 'key'
  | 'layout'
  | 'location'
  | 'lock'
  | 'menu'
  | 'message'
  | 'mic'
  | 'more'
  | 'phone'
  | 'plus'
  | 'report'
  | 'rupee'
  | 'search'
  | 'send'
  | 'settings'
  | 'share'
  | 'sort'
  | 'star'
  | 'users'
  | 'whatsapp'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, className, ...props }: IconProps) {
  const strokeProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  }

  const path = (() => {
    switch (name) {
      case 'arrow-left':
        return <path d="M19 12H5m7 7-7-7 7-7" />
      case 'bell':
        return (
          <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </>
        )
      case 'bookmark':
        return <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      case 'calendar':
        return (
          <>
            <path d="M8 2v4m8-4v4M3 10h18" />
            <rect x="3" y="4" width="18" height="18" rx="3" />
          </>
        )
      case 'chart':
        return (
          <>
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M8 15v-4" />
            <path d="M12 15V8" />
            <path d="M16 15v-6" />
          </>
        )
      case 'check':
        return <path d="m20 6-11 11-5-5" />
      case 'chevron-right':
        return <path d="m9 18 6-6-6-6" />
      case 'clipboard':
        return (
          <>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-5" />
          </>
        )
      case 'dots':
        return (
          <>
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          </>
        )
      case 'eye':
        return (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )
      case 'filter':
        return (
          <>
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </>
        )
      case 'graduation':
        return (
          <>
            <path d="m22 10-10-5-10 5 10 5 10-5Z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </>
        )
      case 'heart':
        return <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      case 'home':
        return (
          <>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 10v10h14V10" />
            <path d="M9 20v-6h6v6" />
          </>
        )
      case 'key':
        return (
          <>
            <circle cx="7.5" cy="14.5" r="4.5" />
            <path d="M11 11 21 1" />
            <path d="m16 6 2 2" />
            <path d="m19 3 2 2" />
          </>
        )
      case 'layout':
        return (
          <>
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
          </>
        )
      case 'location':
        return (
          <>
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </>
        )
      case 'lock':
        return (
          <>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </>
        )
      case 'menu':
        return (
          <>
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </>
        )
      case 'message':
        return (
          <>
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            <path d="M8 9h8" />
            <path d="M8 13h5" />
          </>
        )
      case 'mic':
        return (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <path d="M12 17v5" />
            <path d="M8 22h8" />
          </>
        )
      case 'more':
        return (
          <>
            <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
          </>
        )
      case 'phone':
        return <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 5.2 12 19.8 19.8 0 0 1 2.1 3.4 2 2 0 0 1 4.1 1h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 9a16 16 0 0 0 6.9 6.9l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" />
      case 'plus':
        return (
          <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </>
        )
      case 'report':
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </>
        )
      case 'rupee':
        return (
          <>
            <path d="M6 3h12" />
            <path d="M6 8h12" />
            <path d="M13 21 7 13h3a6 6 0 0 0 0-10" />
          </>
        )
      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </>
        )
      case 'send':
        return (
          <>
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </>
        )
      case 'settings':
        return (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V22a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
          </>
        )
      case 'share':
        return (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 10.5 6.8-4" />
            <path d="m8.6 13.5 6.8 4" />
          </>
        )
      case 'sort':
        return (
          <>
            <path d="M11 5h10" />
            <path d="M7 5H3" />
            <path d="M7 5v14" />
            <path d="m4 16 3 3 3-3" />
            <path d="M13 19h8" />
          </>
        )
      case 'star':
        return <path d="m12 2 3.1 6.4 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.3L7 14.3 2 9.4l6.9-1Z" />
      case 'users':
        return (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
            <path d="M16 3.1a4 4 0 0 1 0 7.8" />
          </>
        )
      case 'whatsapp':
        return (
          <path
            d="M12 2a9.6 9.6 0 0 0-8.3 14.4L2.6 22l5.7-1.4A9.6 9.6 0 1 0 12 2Zm5.2 13.5c-.2.6-1.2 1.1-1.7 1.1-.5.1-1 0-1.7-.2-3.7-1.2-6.1-4.9-6.3-5.1-.2-.2-1.5-2-1.5-3.8 0-1.7.9-2.6 1.2-2.9.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .7.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .7-.1.2-.2.4-.4.6l-.5.6c-.2.2-.4.4-.2.7.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.5-.2.8-.1.3.1 2.1 1 2.4 1.2.4.2.6.3.7.5.1.1.1.8-.1 1.5Z"
            fill="currentColor"
            stroke="none"
          />
        )
      default:
        return null
    }
  })()

  return (
    <svg
      aria-hidden="true"
      className={cx('h-5 w-5 shrink-0', className)}
      viewBox="0 0 24 24"
      {...strokeProps}
      {...props}
    >
      {path}
    </svg>
  )
}

export function TakhtiLogo({ compact = false, tagline = 'Your Digital Register' }: { compact?: boolean; tagline?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#ecd7ab] bg-[#fff8ea] shadow-[0_8px_18px_rgba(122,78,25,0.12)]">
        <svg className="h-7 w-7" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="8" y="7" width="32" height="34" rx="5" fill="#f1b65d" />
          <rect x="12" y="11" width="24" height="26" rx="3" fill="#fff7e7" />
          <path d="M18 16v17m12-17v17" stroke="#2f251c" strokeWidth="1.7" />
          <path d="M16 18c4-1.6 7-.7 8 1.5 1-2.2 4-3.1 8-1.5M16 24c4-1.4 7-.5 8 1.2 1-1.7 4-2.6 8-1.2" fill="none" stroke="#2f251c" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M7 14 4 16m37-2 3 2M7 34l-3 2m37-2 3 2" stroke="#d9852c" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <div>
          <p className="font-serif text-[32px] font-bold leading-none text-[#17120d]">Takhti</p>
          <p className="mt-1 text-[12px] font-medium text-[#574e46]">{tagline}</p>
        </div>
      )}
    </div>
  )
}

export function PersonAvatar({
  name,
  variant = 'male',
  size = 'md',
}: {
  name: string
  variant?: 'male' | 'female' | 'student'
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const dimensions = size === 'lg' ? 'h-24 w-24' : size === 'sm' ? 'h-11 w-11' : 'h-14 w-14'
  const face = variant === 'female' ? '#d99472' : variant === 'student' ? '#e0a175' : '#c9875d'
  const shirt = variant === 'female' ? '#5d57b8' : variant === 'student' ? '#e86f45' : '#1d6f43'
  const hair = variant === 'female' ? '#161616' : '#1f1f1f'

  return (
    <div className={cx('overflow-hidden rounded-full border border-[#eadfcd] bg-[#f8e6cc]', dimensions)} title={name}>
      <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
        <rect width="72" height="72" fill="#f7e4c6" />
        <circle cx="36" cy="31" r="16" fill={face} />
        {variant === 'female' ? (
          <path d="M17 35c1-18 9-26 20-26 12 0 18 11 18 26-7-4-30-4-38 0Z" fill={hair} />
        ) : (
          <path d="M20 27c1-12 8-18 18-18 9 0 15 7 14 18-8-5-20-5-32 0Z" fill={hair} />
        )}
        <circle cx="31" cy="32" r="1.8" fill="#151515" />
        <circle cx="42" cy="32" r="1.8" fill="#151515" />
        {variant === 'male' && <path d="M27 43c5 5 13 5 18 0v4c-6 4-12 4-18 0Z" fill="#2c1b16" />}
        {variant === 'male' && (
          <g fill="none" stroke="#151515" strokeWidth="1.6">
            <circle cx="30" cy="32" r="4" />
            <circle cx="43" cy="32" r="4" />
            <path d="M34 32h5" />
          </g>
        )}
        <path d="M14 72c2-18 13-26 22-26s20 8 22 26Z" fill={shirt} />
        <text x="36" y="67" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
          {initials}
        </text>
      </svg>
    </div>
  )
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={cx(
        'grid h-10 w-10 place-items-center rounded-xl border border-[#eadfcd] bg-white text-[#302820] shadow-sm active:scale-[0.98]',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={cx(
        'w-full rounded-xl bg-[#4930a8] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] active:scale-[0.99] disabled:opacity-50',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function LinkButton({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a
      className={cx(
        'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d7b51] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)] active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export function Chip({
  children,
  active = false,
  className,
}: {
  children: ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold',
        active ? 'border-[#d9eee2] bg-[#eaf7ef] text-[#0d7b51]' : 'border-[#eee4d8] bg-white text-[#5d544c]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cx('min-h-screen bg-[#fbf8f1] text-[#1d1813]', className)}>
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[linear-gradient(180deg,#fffaf1_0%,#fbf8f1_44%,#ffffff_100%)]">
        {children}
      </div>
    </main>
  )
}

export function PageHeader({
  title,
  subtitle,
  left,
  right,
  className,
}: {
  title: string
  subtitle?: string
  left?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <header className={cx('sticky top-0 z-30 border-b border-[#efe4d6] bg-[#fffaf1]/95 px-4 py-3 backdrop-blur', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {left}
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-[#1d1813]">{title}</h1>
            {subtitle && <p className="truncate text-[11px] font-medium text-[#746a60]">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  )
}

export function FamilyStudyIllustration({ className }: { className?: string }) {
  return (
    <svg className={cx('w-full', className)} viewBox="0 0 360 210" role="img" aria-label="Parent, student and teacher studying">
      <rect width="360" height="210" rx="22" fill="#fff2df" />
      <path d="M28 176c46-16 102-14 145-3 66 17 110 18 158-4v41H28Z" fill="#f4d9b9" />
      <rect x="210" y="68" width="74" height="72" rx="8" fill="#f9e8cf" />
      <path d="M238 46v30M252 58v18M224 60v16" stroke="#e5caa8" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(36 68)">
        <foreignObject width="96" height="96">
          <PersonAvatar name="Parent" variant="female" size="lg" />
        </foreignObject>
      </g>
      <g transform="translate(136 86)">
        <foreignObject width="96" height="96">
          <PersonAvatar name="Student" variant="student" size="lg" />
        </foreignObject>
      </g>
      <g transform="translate(238 56)">
        <foreignObject width="96" height="96">
          <PersonAvatar name="Teacher" variant="male" size="lg" />
        </foreignObject>
      </g>
      <rect x="72" y="164" width="218" height="24" rx="7" fill="#f3c98f" />
      <path d="M88 165c20-12 43-12 68 0M178 165c23-12 47-12 72 0" fill="none" stroke="#fff9ee" strokeWidth="4" strokeLinecap="round" />
      <path d="M313 136c10 17 14 35 8 54M331 126c-11 18-14 40-10 64" stroke="#82a85d" strokeWidth="7" strokeLinecap="round" />
      <circle cx="327" cy="118" r="10" fill="#9abb6d" />
      <circle cx="309" cy="128" r="9" fill="#9abb6d" />
    </svg>
  )
}

export function TeacherWelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg className={cx('w-full', className)} viewBox="0 0 320 230" role="img" aria-label="Teacher with notebook">
      <rect width="320" height="230" rx="28" fill="#fff3df" />
      <path d="M32 187c47-18 86-8 123-2 56 8 93 2 133-15v60H32Z" fill="#f2d7b7" />
      <g transform="translate(112 52)">
        <foreignObject width="96" height="96">
          <PersonAvatar name="Suresh" variant="male" size="lg" />
        </foreignObject>
      </g>
      <path d="M102 170c22-34 88-34 111 0v22H102Z" fill="#13704b" />
      <rect x="84" y="143" width="58" height="40" rx="5" fill="#f8f0df" stroke="#e7d5b9" strokeWidth="3" />
      <path d="M94 153h36M94 162h26M94 171h31" stroke="#caa66f" strokeWidth="3" strokeLinecap="round" />
      <rect x="212" y="47" width="44" height="38" rx="8" fill="#fffaf0" stroke="#e8d7bc" strokeWidth="3" />
      <path d="M223 39v15m22-15v15M221 63h26" stroke="#caa66f" strokeWidth="4" strokeLinecap="round" />
      <rect x="236" y="111" width="48" height="42" rx="9" fill="#fffaf0" stroke="#e8d7bc" strokeWidth="3" />
      <path d="M247 139v-13m13 13v-21m13 21v-29" stroke="#8cb36f" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 150c8 14 9 28 6 43M74 136c-12 17-15 37-11 57" stroke="#8cb36f" strokeWidth="7" strokeLinecap="round" />
      <circle cx="74" cy="130" r="9" fill="#9fc179" />
      <circle cx="56" cy="143" r="8" fill="#9fc179" />
    </svg>
  )
}

export function LockKeyIllustration({ className }: { className?: string }) {
  return (
    <svg className={cx('w-full', className)} viewBox="0 0 280 220" role="img" aria-label="Secure connect">
      <rect width="280" height="220" rx="28" fill="#fff2df" />
      <path d="M58 103c28-68 64 9 92-43 28-52 80-19 68 45-12 63-79 68-135 61-31-4-42-23-25-63Z" fill="#fffaf2" />
      <rect x="72" y="116" width="54" height="56" rx="10" fill="#5b49b6" />
      <path d="M84 116V98a15 15 0 0 1 30 0v18" fill="none" stroke="#4930a8" strokeWidth="8" strokeLinecap="round" />
      <circle cx="99" cy="142" r="7" fill="#f5eaf4" />
      <path d="M99 148v11" stroke="#f5eaf4" strokeWidth="5" strokeLinecap="round" />
      <circle cx="181" cy="102" r="17" fill="#eab451" />
      <circle cx="181" cy="102" r="5" fill="#fffaf2" />
      <path d="M191 112 217 138m-10-1 10-10m-21 0 8-8" stroke="#eab451" strokeWidth="9" strokeLinecap="round" />
      <circle cx="150" cy="66" r="18" fill="#b5a2df" />
      <path d="M150 84v30" stroke="#b5a2df" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

export function ReportReadyIllustration({ className }: { className?: string }) {
  return (
    <svg className={cx('w-full', className)} viewBox="0 0 280 190" role="img" aria-label="Report ready">
      <rect width="280" height="190" rx="24" fill="#fff2df" />
      <rect x="62" y="36" width="112" height="132" rx="15" fill="#fffdf8" stroke="#eadfcd" strokeWidth="3" />
      <path d="M91 70h54M91 94h54M91 118h36" stroke="#d0b891" strokeWidth="6" strokeLinecap="round" />
      <rect x="91" y="136" width="52" height="12" rx="6" fill="#eaf7ef" />
      <circle cx="194" cy="61" r="24" fill="#4930a8" opacity="0.13" />
      <path d="m184 63 8 8 19-22" fill="none" stroke="#4930a8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M207 118h35" stroke="#25d366" strokeWidth="9" strokeLinecap="round" />
      <path d="m228 101 22 17-22 17" fill="none" stroke="#25d366" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
