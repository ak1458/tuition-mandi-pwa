/**
 * Tuition Mandi — design kit primitives.
 * Faithful TSX port of the Clone-design prototype's `ui.jsx`, so screens
 * rebuilt with these match the prototype exactly. All colors come from CSS
 * vars (tokens.css) → automatic light/dark. Reuses the shared `Icon`.
 */
import type { CSSProperties, ReactNode } from 'react'
import { Icon, type IconName } from '@/components/common/tuition-mandi-ui'

const AVATAR_COLORS: Array<[string, string]> = [
  ['#F2A114', '#2A1C00'], ['#138A5E', '#fff'], ['#2F6DB0', '#fff'],
  ['#E14B36', '#fff'], ['#7A4DC2', '#fff'], ['#C77400', '#fff'], ['#0E8C8C', '#fff'],
]
export function avatarColor(name = ''): [string, string] {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
export function initials(name = '') {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export function Avatar({ name = '', size = 46, radius = 15, ring = false }: { name?: string; size?: number; radius?: number; ring?: boolean }) {
  const [bg, fg] = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, background: bg, color: fg,
      display: 'grid', placeItems: 'center', fontFamily: 'var(--font-stack-display)', fontWeight: 800,
      fontSize: size * 0.36, flexShrink: 0, boxShadow: ring ? '0 0 0 3px var(--surface)' : 'none',
    }}>{initials(name)}</div>
  )
}

type PillTone = 'gold' | 'leaf' | 'coral' | 'sky' | 'ink' | 'soft'
const PILL_TONES: Record<PillTone, [string, string]> = {
  gold: ['var(--marigold-wash)', 'var(--marigold-deep)'],
  leaf: ['var(--leaf-wash)', 'var(--leaf-deep)'],
  coral: ['var(--coral-wash)', 'var(--coral-deep)'],
  sky: ['var(--sky-wash)', 'var(--sky)'],
  ink: ['var(--ink)', 'var(--on-ink)'],
  soft: ['var(--surface-2)', 'var(--ink-soft)'],
}
export function Pill({ tone = 'soft', children, dot = false, style }: { tone?: PillTone; children: ReactNode; dot?: boolean; style?: CSSProperties }) {
  const [bg, fg] = PILL_TONES[tone] || PILL_TONES.soft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: fg,
      fontWeight: 700, fontSize: 11.5, padding: '5px 10px', borderRadius: 999,
      border: tone === 'soft' ? '1px solid var(--line)' : 'none', whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />}
      {children}
    </span>
  )
}

type BtnVariant = 'ink' | 'gold' | 'leaf' | 'coral' | 'whatsapp' | 'sky' | 'ghost' | 'soft'
export function Btn({ variant = 'ink', children, onClick, icon, iconRight, full = false, size = 'md', disabled, style }: {
  variant?: BtnVariant; children: ReactNode; onClick?: (e: React.MouseEvent) => void; icon?: IconName; iconRight?: IconName
  full?: boolean; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; style?: CSSProperties
}) {
  const pad = size === 'sm' ? '9px 14px' : size === 'lg' ? '16px 22px' : '13px 20px'
  const fs = size === 'sm' ? 13.5 : size === 'lg' ? 16 : 15
  const variants: Record<BtnVariant, CSSProperties> = {
    ink: { background: 'var(--ink)', color: 'var(--on-ink)', boxShadow: 'var(--shadow-ink)' },
    gold: { background: 'var(--marigold)', color: 'var(--on-marigold)', boxShadow: 'var(--shadow-marigold)' },
    leaf: { background: 'var(--leaf)', color: '#fff' },
    coral: { background: 'var(--coral)', color: '#fff' },
    whatsapp: { background: '#25D366', color: '#fff' },
    sky: { background: 'var(--sky)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--line-strong)' },
    soft: { background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' },
  }
  const v = variants[variant] || variants.ink
  return (
    <button onClick={onClick} disabled={disabled} className="tm-btn" style={{
      ...v, border: (v as { border?: string }).border || 'none', borderRadius: 'var(--radius-btn)',
      padding: pad, fontFamily: 'var(--font-stack-latin)', fontWeight: 700, fontSize: fs, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: full ? '100%' : 'auto', opacity: disabled ? 0.45 : 1, transition: 'transform .12s ease, filter .2s ease', ...style,
    }}>
      {icon && <Icon name={icon} style={{ width: fs + 3, height: fs + 3 }} />}
      {children}
      {iconRight && <Icon name={iconRight} style={{ width: fs + 3, height: fs + 3 }} />}
    </button>
  )
}

export function IconBtn({ name, onClick, label, active = false, badge, size = 40, style }: {
  name: IconName; onClick?: () => void; label: string; active?: boolean; badge?: number; size?: number; style?: CSSProperties
}) {
  return (
    <button onClick={onClick} aria-label={label} className="tm-btn" style={{
      width: size, height: size, display: 'grid', placeItems: 'center', borderRadius: 13,
      background: active ? 'var(--ink)' : 'var(--surface)', color: active ? 'var(--on-ink)' : 'var(--ink)',
      border: active ? 'none' : '1px solid var(--line)', cursor: 'pointer', position: 'relative', flexShrink: 0,
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      <Icon name={name} style={{ width: 20, height: 20 }} />
      {badge != null && (
        <span style={{
          position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999,
          background: 'var(--coral)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center',
          border: '2px solid var(--surface)', fontFamily: 'var(--font-stack-mono)',
        }}>{badge}</span>
      )}
    </button>
  )
}

export function Card({ children, pad = 16, style, onClick, soft = false }: { children: ReactNode; pad?: number; style?: CSSProperties; onClick?: () => void; soft?: boolean }) {
  return (
    <div onClick={onClick} style={{
      background: soft ? 'var(--surface-2)' : 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-card)', padding: pad, boxShadow: soft ? 'none' : 'var(--shadow-sm)',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  )
}

export function SectionLabel({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
      <h3 className="font-display" style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap' }}>{children}</h3>
      {action && <button onClick={onAction} className="tm-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--marigold-deep)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{action}<Icon name="chevron" style={{ width: 14, height: 14 }} /></button>}
    </div>
  )
}

export function StatTile({ value, label, tone, icon, onClick }: { value: ReactNode; label: string; tone: string; icon: IconName; onClick?: () => void }) {
  return (
    <Card onClick={onClick} pad={13} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tone }}>
        <Icon name={icon} style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
      </div>
      <div className="font-mono" style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', marginTop: 7, lineHeight: 1 }}>{value}</div>
    </Card>
  )
}

export function Verified({ size = 16 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 999, background: 'var(--leaf)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon name="check" style={{ width: size * 0.66, height: size * 0.66, color: '#fff' }} />
    </span>
  )
}

export function Segmented<T extends string>({ options, value, onChange, style }: { options: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', background: 'var(--paper-2)', borderRadius: 12, padding: 4, gap: 4, ...style }}>
      {options.map((o) => {
        const act = o.value === value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className="tm-btn" style={{
            flex: 1, padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-stack-latin)', fontWeight: 700, fontSize: 13,
            background: act ? 'var(--surface)' : 'transparent', color: act ? 'var(--ink)' : 'var(--ink-soft)',
            boxShadow: act ? 'var(--shadow-sm)' : 'none', transition: 'all .18s ease',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: 72, height: 72, margin: '0 auto 18px', borderRadius: 22, background: 'var(--marigold-wash)', display: 'grid', placeItems: 'center', color: 'var(--marigold-deep)' }}>
        <Icon name={icon} style={{ width: 32, height: 32 }} />
      </div>
      <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.55, maxWidth: 260, marginInline: 'auto' }}>{body}</div>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

export function TopBar({ title, subtitle, onBack, right }: { title?: string; subtitle?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20, padding: '12px 18px',
      background: 'color-mix(in srgb, var(--paper) 86%, transparent)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" className="tm-btn" style={{
          width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', cursor: 'pointer',
          background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)', flexShrink: 0, boxShadow: 'var(--shadow-sm)',
        }}><Icon name="arrow-left" style={{ width: 19, height: 19 }} /></button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
