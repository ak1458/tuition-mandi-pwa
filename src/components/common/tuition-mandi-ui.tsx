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
  | 'moon'
  | 'more'
  | 'sun'
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
      case 'moon':
        return <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      case 'sun':
        return (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )
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

export function TuitionMandiLogo({ compact = false, tagline = 'Your Digital Register' }: { compact?: boolean; tagline?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[14px]"
        style={{ background: 'var(--marigold-wash)', boxShadow: 'var(--shadow-sm)' }}
      >
        {/* Brand mark — open book (learning) + spark (the "aha" of a good tutor) */}
        <svg className="h-7 w-7" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 14.5 C 19 11.2, 12 10.4, 6.5 12.2 V 35.4 C 12 33.6, 19 34.2, 24 37.6 Z" fill="var(--marigold)" />
          <path d="M24 14.5 C 29 11.2, 36 10.4, 41.5 12.2 V 35.4 C 36 33.6, 29 34.2, 24 37.6 Z" fill="var(--marigold)" />
          <path d="M24 15.4 V 36.6" stroke="var(--on-marigold)" strokeWidth="1.7" strokeLinecap="round" />
          <g stroke="var(--on-marigold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.5">
            <path d="M11 19 H 19.5 M11 23.5 H 19.5 M11 28 H 18" />
            <path d="M28.5 19 H 37 M28.5 23.5 H 37 M30 28 H 37" />
          </g>
          <path
            d="M38.5 6 l1.05 2.45 2.45 1.05 -2.45 1.05 -1.05 2.45 -1.05 -2.45 -2.45 -1.05 2.45 -1.05 Z"
            fill="var(--on-marigold)"
          />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-display text-[21px] font-extrabold leading-none tracking-[-0.04em] truncate" style={{ color: 'var(--ink)' }}>
            Tuition<span style={{ color: 'var(--marigold-deep)' }}>Mandi</span>
          </p>
          <p className="mt-1.5 text-[10px] font-semibold tracking-wide truncate" style={{ color: 'var(--ink-soft)' }}>{tagline}</p>
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
    <div className={cx('overflow-hidden rounded-full border border-[#e5decf] bg-[#f8e6cc]', dimensions)} title={name}>
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
        'grid h-10 w-10 place-items-center rounded-xl border border-[#e5decf] bg-white text-[#302820] shadow-sm active:scale-[0.98]',
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
        'w-full rounded-xl bg-[#d6850a] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] active:scale-[0.99] disabled:opacity-50',
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
        'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#138a5e] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)] active:scale-[0.99]',
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
        active ? 'border-[#d9eee2] bg-[#dcf1e7] text-[#138a5e]' : 'border-[#e5decf] bg-white text-[#5d544c]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cx('min-h-screen bg-[#f4f1ea] text-[#1c1916]', className)}>
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[linear-gradient(180deg,#f4f1ea_0%,#f4f1ea_44%,#ffffff_100%)]">
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
    <header className={cx('sticky top-0 z-30 border-b border-[#efe4d6] bg-[#f4f1ea]/95 px-4 py-3 backdrop-blur', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {left}
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-[#1c1916]">{title}</h1>
            {subtitle && <p className="truncate text-[11px] font-medium text-[#847a6c]">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  )
}

export function FamilyStudyIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cx('w-full', className)}
      viewBox="0 0 400 320"
      role="img"
      aria-label="Parent and child studying together at a warm home study desk"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="familySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5e2" />
          <stop offset="55%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="familyHalo" cx="50%" cy="36%" r="55%">
          <stop offset="0%" stopColor="#ffe8b8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffe8b8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="deskWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d9b6" />
          <stop offset="100%" stopColor="#d9b27e" />
        </linearGradient>
        <linearGradient id="bookOpen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f4eddc" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="320" rx="24" fill="url(#familySky)" />
      <ellipse cx="200" cy="118" rx="160" ry="92" fill="url(#familyHalo)" />

      {/* Decorative star / dot / heart floating cues */}
      <path
        d="M156 38l3 7 7 .7-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7-.7z"
        fill="#f3c64d"
      />
      <circle cx="244" cy="42" r="4" fill="#7da8ee" />
      <path
        d="M205 56c-4-6-12-3-12 3 0 7 12 13 12 13s12-6 12-13c0-6-8-9-12-3z"
        fill="#f4a3a3"
      />

      {/* Left bookshelf hint */}
      <rect x="22" y="92" width="48" height="98" rx="4" fill="#f4e2c4" />
      <rect x="28" y="100" width="36" height="6" rx="2" fill="#d8b986" />
      <rect x="28" y="112" width="28" height="6" rx="2" fill="#c89a6a" />
      <rect x="28" y="124" width="34" height="6" rx="2" fill="#b07e58" />
      <rect x="28" y="136" width="22" height="6" rx="2" fill="#d8b986" />
      <rect x="28" y="148" width="30" height="6" rx="2" fill="#c89a6a" />

      {/* Right potted plant */}
      <path
        d="M348 196c-6-18-2-44 8-58M362 196c4-22 16-38 28-46M334 196c-2-14 4-30 14-40"
        stroke="#82a85d"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="368" cy="148" rx="14" ry="9" fill="#9fc179" />
      <ellipse cx="356" cy="158" rx="11" ry="7" fill="#9fc179" />
      <ellipse cx="346" cy="168" rx="10" ry="7" fill="#b3d18d" />
      <path d="M338 198h44l-4 28h-36z" fill="#d09060" />

      {/* Photo frame on wall */}
      <rect x="288" y="58" width="42" height="36" rx="4" fill="#ffffff" stroke="#e0c69b" strokeWidth="2" />
      <path d="M294 86l8-10 6 6 8-12 8 16z" fill="#cfe2bd" />
      <circle cx="318" cy="68" r="3" fill="#f3c64d" />

      {/* Desk */}
      <rect x="32" y="244" width="336" height="20" rx="6" fill="url(#deskWood)" />
      <rect x="50" y="264" width="6" height="38" fill="#b08454" />
      <rect x="344" y="264" width="6" height="38" fill="#b08454" />

      {/* Open book between them */}
      <path
        d="M158 220c14-10 36-10 50 0v22c-14-8-36-8-50 0z"
        fill="url(#bookOpen)"
        stroke="#d8b986"
        strokeWidth="1.5"
      />
      <path d="M183 220v22" stroke="#d8b986" strokeWidth="1.5" />
      <path d="M168 226h12M168 232h10M196 226h12M196 232h10" stroke="#caa66f" strokeWidth="1.5" strokeLinecap="round" />

      {/* Stack of books on left */}
      <rect x="56" y="226" width="40" height="8" rx="2" fill="#3f7bc7" />
      <rect x="60" y="234" width="38" height="8" rx="2" fill="#f3c64d" />
      <rect x="58" y="242" width="40" height="6" rx="2" fill="#e07c4d" />

      {/* Coffee mug right */}
      <rect x="316" y="222" width="22" height="22" rx="4" fill="#f3eddc" stroke="#d8b986" strokeWidth="1.5" />
      <path d="M338 226h6a4 4 0 0 1 0 8h-6" fill="none" stroke="#d8b986" strokeWidth="1.5" />
      <path d="M324 218c0-3 2-3 2-6M330 218c0-3 2-3 2-6" stroke="#caa66f" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* PARENT (mother) — left figure */}
      {/* Hair back */}
      <path
        d="M88 122c0-30 18-48 42-48 26 0 42 20 42 50v52c-12 6-72 6-84 0z"
        fill="#1c1411"
      />
      {/* Face */}
      <ellipse cx="130" cy="134" rx="22" ry="25" fill="#e2a987" />
      {/* Hair front */}
      <path
        d="M108 116c4-22 18-32 36-30s28 14 28 30c-6-2-14 0-22 4-2-6-10-10-22-4-8 4-16 4-20 0z"
        fill="#1c1411"
      />
      {/* Eyes */}
      <ellipse cx="121" cy="134" rx="1.6" ry="2" fill="#1f1612" />
      <ellipse cx="139" cy="134" rx="1.6" ry="2" fill="#1f1612" />
      {/* Smile */}
      <path d="M124 144c2 3 8 4 12 0" stroke="#7a4938" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Cardigan body */}
      <path
        d="M76 240c0-32 18-58 54-58s54 26 54 58H76z"
        fill="#7466c8"
      />
      {/* Inner shirt */}
      <path d="M114 188c10 8 22 8 32 0v20c-10 6-22 6-32 0z" fill="#fcfcfc" />
      {/* Arm reaching to book */}
      <path
        d="M152 218c10-4 16-2 24 6"
        stroke="#7466c8"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="178" cy="226" rx="6" ry="5" fill="#e2a987" />
      {/* Pen in hand */}
      <path d="M180 230l8 6" stroke="#1f1612" strokeWidth="2.2" strokeLinecap="round" />

      {/* CHILD — middle figure */}
      <ellipse cx="200" cy="160" rx="18" ry="20" fill="#e8b18a" />
      {/* Hair */}
      <path d="M184 152c2-16 12-22 24-20s16 12 14 22c-6-2-12 0-18 4-2-4-10-8-20-6z" fill="#231811" />
      {/* Eyes */}
      <ellipse cx="193" cy="160" rx="1.6" ry="2" fill="#1f1612" />
      <ellipse cx="207" cy="160" rx="1.6" ry="2" fill="#1f1612" />
      {/* Smile */}
      <path d="M196 168c2 3 6 3 8 0" stroke="#7a4938" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* Body / orange shirt */}
      <path d="M178 240c0-26 12-46 22-46s22 20 22 46h-44z" fill="#e87149" />
      {/* Collar */}
      <path d="M192 196l8 8 8-8" fill="none" stroke="#b85432" strokeWidth="2" strokeLinecap="round" />
      {/* Arms / writing */}
      <path d="M188 220c0-8 4-12 12-12s12 4 12 12" stroke="#e8b18a" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M204 224l8 8" stroke="#1f1612" strokeWidth="2" strokeLinecap="round" />

      {/* PARENT (father) — right figure */}
      {/* Hair */}
      <path d="M252 110c0-22 14-36 32-36s32 14 32 36v8c-10-6-54-6-64 0z" fill="#1d130f" />
      {/* Face */}
      <ellipse cx="284" cy="132" rx="22" ry="24" fill="#cf9472" />
      {/* Beard */}
      <path
        d="M262 138c0 14 10 24 22 24s22-10 22-24c-4 6-12 8-22 8s-18-2-22-8z"
        fill="#231811"
      />
      {/* Glasses */}
      <circle cx="274" cy="130" r="6.5" fill="none" stroke="#1f1612" strokeWidth="1.6" />
      <circle cx="294" cy="130" r="6.5" fill="none" stroke="#1f1612" strokeWidth="1.6" />
      <path d="M280.5 130h7" stroke="#1f1612" strokeWidth="1.6" />
      {/* Eyes inside glasses */}
      <circle cx="274" cy="130" r="1.6" fill="#1f1612" />
      <circle cx="294" cy="130" r="1.6" fill="#1f1612" />
      {/* Smile */}
      <path d="M278 144c4 3 8 3 12 0" stroke="#7a4938" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Green shirt */}
      <path d="M232 240c0-32 22-58 52-58s52 26 52 58h-104z" fill="#2e8b58" />
      {/* Collar shadow */}
      <path d="M278 188c4 4 10 4 14 0v8c-4 3-10 3-14 0z" fill="#236b44" />
      {/* Buttons */}
      <circle cx="285" cy="200" r="1.5" fill="#1d4d31" />
      <circle cx="285" cy="212" r="1.5" fill="#1d4d31" />
      <circle cx="285" cy="224" r="1.5" fill="#1d4d31" />
      {/* Arm reaching */}
      <path d="M252 220c-10-2-18 2-24 10" stroke="#2e8b58" strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="226" cy="232" rx="6" ry="5" fill="#cf9472" />
    </svg>
  )
}

export function TeacherWelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cx('w-full', className)}
      viewBox="0 0 360 320"
      role="img"
      aria-label="Teacher in glasses holding a notebook with floating schedule, students and progress cards"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="teacherSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5e2" />
          <stop offset="55%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="teacherHalo" cx="38%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#ffe8b8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffe8b8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bookCover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8eed5" />
          <stop offset="100%" stopColor="#e8d4a8" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="360" height="320" rx="24" fill="url(#teacherSky)" />
      <ellipse cx="160" cy="150" rx="170" ry="120" fill="url(#teacherHalo)" />

      {/* Soft city silhouette in background */}
      <g opacity="0.18">
        <rect x="40" y="178" width="20" height="60" fill="#a99072" />
        <rect x="62" y="158" width="14" height="80" fill="#a99072" />
        <rect x="80" y="170" width="22" height="68" fill="#a99072" />
        <rect x="240" y="160" width="18" height="78" fill="#a99072" />
        <rect x="262" y="180" width="14" height="58" fill="#a99072" />
        <rect x="280" y="168" width="20" height="70" fill="#a99072" />
      </g>

      {/* Decorative blob behind the teacher */}
      <path
        d="M76 64c44-22 110-18 142 18 28 30 28 84 4 130-26 48-92 64-148 38-58-26-78-90-46-138 14-22 28-36 48-48z"
        fill="#fceeca"
        opacity="0.55"
      />

      {/* Tiny leaf bottom-left */}
      <path
        d="M28 248c0-22 12-36 28-40-2 18-12 30-28 40z"
        fill="#9fc179"
      />
      <path d="M40 222c0-10 6-16 14-18-2 12-6 18-14 18z" fill="#b3d18d" />
      <rect x="22" y="248" width="32" height="22" rx="4" fill="#e3c79a" />

      {/* ── TEACHER ── */}
      {/* Body / shirt */}
      <path
        d="M104 280c0-46 28-78 76-78s76 32 76 78v40H104z"
        fill="#1f7a55"
      />
      {/* Shirt placket */}
      <path d="M174 230v76M186 230v76" stroke="#155e3f" strokeWidth="1.6" />
      <circle cx="180" cy="244" r="2" fill="#155e3f" />
      <circle cx="180" cy="262" r="2" fill="#155e3f" />
      <circle cx="180" cy="280" r="2" fill="#155e3f" />
      {/* Collar */}
      <path d="M158 218l22 18 22-18-22-12z" fill="#1f7a55" />
      <path d="M180 236l-12-18M180 236l12-18" stroke="#155e3f" strokeWidth="1.5" fill="none" />

      {/* Neck */}
      <ellipse cx="180" cy="200" rx="14" ry="10" fill="#cf9472" />

      {/* Head */}
      <ellipse cx="180" cy="158" rx="42" ry="46" fill="#cf9472" />
      {/* Hair */}
      <path
        d="M138 138c0-30 18-50 42-50s42 20 42 50v6c-12-8-20-12-30-10-2-12-12-18-22-16-12 2-22 12-32 20z"
        fill="#1d130f"
      />
      {/* Sideburns */}
      <path d="M142 162c-2 14 0 26 6 36" stroke="#1d130f" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M218 162c2 14 0 26-6 36" stroke="#1d130f" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Beard */}
      <path
        d="M146 168c0 30 16 44 34 44s34-14 34-44c-6 14-22 18-34 18s-28-4-34-18z"
        fill="#231811"
      />
      {/* Glasses */}
      <circle cx="166" cy="158" r="11" fill="#fffdf6" stroke="#1f1612" strokeWidth="2.2" />
      <circle cx="194" cy="158" r="11" fill="#fffdf6" stroke="#1f1612" strokeWidth="2.2" />
      <path d="M177 158h6" stroke="#1f1612" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <circle cx="166" cy="159" r="2.4" fill="#1f1612" />
      <circle cx="194" cy="159" r="2.4" fill="#1f1612" />
      <circle cx="167" cy="158" r="0.8" fill="#fff" />
      <circle cx="195" cy="158" r="0.8" fill="#fff" />
      {/* Smile (subtle, behind the beard) */}
      <path d="M172 184c4 4 12 4 16 0" stroke="#7a4938" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Arm + book held in hand */}
      <path
        d="M148 248c-8 8-12 22-8 36 4 14 16 22 28 22"
        stroke="#1f7a55"
        strokeWidth="22"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hand */}
      <ellipse cx="172" cy="304" rx="11" ry="9" fill="#cf9472" />
      {/* Notebook */}
      <rect
        x="138"
        y="262"
        width="80"
        height="52"
        rx="6"
        fill="url(#bookCover)"
        stroke="#caa66f"
        strokeWidth="2"
      />
      <path d="M178 262v52" stroke="#caa66f" strokeWidth="1.5" />
      <path
        d="M148 276h22M148 286h18M148 296h22M188 276h22M188 286h18M188 296h22"
        stroke="#caa66f"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Bookmark */}
      <path d="M200 262v18l4-4 4 4v-18z" fill="#e87149" />

      {/* ── FLOATING CARDS — calendar / students / chart ── */}
      {/* Calendar card */}
      <g>
        <rect x="248" y="46" width="76" height="64" rx="14" fill="#fffdf6" stroke="#ecdcc0" strokeWidth="1.5" />
        <rect x="258" y="58" width="56" height="10" rx="3" fill="#a8893f" opacity="0.18" />
        <path d="M268 54v8M278 54v8M288 54v8M298 54v8" stroke="#a8893f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="266" cy="78" r="2.2" fill="#a8893f" />
        <circle cx="276" cy="78" r="2.2" fill="#a8893f" />
        <circle cx="286" cy="78" r="2.2" fill="#a8893f" />
        <circle cx="296" cy="78" r="2.2" fill="#a8893f" />
        <circle cx="266" cy="88" r="2.2" fill="#a8893f" />
        <circle cx="276" cy="88" r="2.2" fill="#a8893f" />
        <circle cx="286" cy="88" r="2.2" fill="#1f7a55" />
        <circle cx="296" cy="88" r="2.2" fill="#a8893f" />
        <circle cx="266" cy="98" r="2.2" fill="#a8893f" />
        <circle cx="276" cy="98" r="2.2" fill="#a8893f" />
      </g>

      {/* Students card */}
      <g>
        <rect x="262" y="124" width="74" height="62" rx="14" fill="#fffdf6" stroke="#ecdcc0" strokeWidth="1.5" />
        <circle cx="287" cy="148" r="9" fill="none" stroke="#5b8e3a" strokeWidth="2.4" />
        <path d="M275 174c2-9 8-13 12-13s10 4 12 13" stroke="#5b8e3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="307" cy="146" r="7" fill="none" stroke="#5b8e3a" strokeWidth="2.4" />
        <path d="M299 172c1-7 5-10 10-10s10 4 11 10" stroke="#5b8e3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>

      {/* Chart card */}
      <g>
        <rect x="248" y="200" width="76" height="64" rx="14" fill="#fffdf6" stroke="#ecdcc0" strokeWidth="1.5" />
        <path
          d="M260 250l8-10 8 4 8-14 8 6 8-18"
          stroke="#5b8e3a"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M260 252v-30" stroke="#caa66f" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M260 252h44" stroke="#caa66f" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="300" cy="222" r="3" fill="#5b8e3a" />
      </g>
    </svg>
  )
}

export function LockKeyIllustration({ className }: { className?: string }) {
  return (
    <svg className={cx('w-full', className)} viewBox="0 0 280 220" role="img" aria-label="Secure connect">
      <rect width="280" height="220" rx="28" fill="#fff2df" />
      <path d="M58 103c28-68 64 9 92-43 28-52 80-19 68 45-12 63-79 68-135 61-31-4-42-23-25-63Z" fill="#fffaf2" />
      <rect x="72" y="116" width="54" height="56" rx="10" fill="#5b49b6" />
      <path d="M84 116V98a15 15 0 0 1 30 0v18" fill="none" stroke="#d6850a" strokeWidth="8" strokeLinecap="round" />
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
      <rect x="62" y="36" width="112" height="132" rx="15" fill="#fffdf8" stroke="#e5decf" strokeWidth="3" />
      <path d="M91 70h54M91 94h54M91 118h36" stroke="#d0b891" strokeWidth="6" strokeLinecap="round" />
      <rect x="91" y="136" width="52" height="12" rx="6" fill="#dcf1e7" />
      <circle cx="194" cy="61" r="24" fill="#d6850a" opacity="0.13" />
      <path d="m184 63 8 8 19-22" fill="none" stroke="#d6850a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M207 118h35" stroke="#25d366" strokeWidth="9" strokeLinecap="round" />
      <path d="m228 101 22 17-22 17" fill="none" stroke="#25d366" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
