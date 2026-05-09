/**
 * Takhti Design System — Tokens
 * Extracted from Stitch design (project/12697994044832797708)
 * All UI components must import from here. No hardcoded color values in components.
 */

// ── Colors ──────────────────────────────────────────────
export const colors = {
  primary: '#0d7b51',
  primaryContainer: '#0b6845',
  primaryLight: '#eaf7ef',
  onPrimary: '#ffffff',

  danger: '#d84b3f',
  dangerLight: '#fff0ee',

  warning: '#c87b22',
  warningLight: '#fff4df',

  whatsapp: '#25D366',

  bgPage: '#fbf8f1',
  bgCard: '#FFFFFF',

  textPrimary: '#1d1813',
  textSecondary: '#746a60',

  border: '#eadfcd',
  borderLight: '#f3eadc',

  navActive: '#0d7b51',
  navInactive: '#9a8f83',
} as const

// ── Component class presets ─────────────────────────────
export const btn = {
  primary:
    'bg-[#0d7b51] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#0b6845] disabled:opacity-50',
  whatsapp:
    'bg-[#25D366] text-white rounded-xl py-3 w-full font-semibold text-sm flex items-center justify-center gap-2',
  secondary:
    'border border-[#0d7b51] text-[#0d7b51] bg-white rounded-xl py-3 w-full font-semibold text-sm',
  danger:
    'bg-[#d84b3f] text-white rounded-xl py-3 w-full font-semibold text-sm',
} as const

export const pill = {
  paid: 'bg-[#eaf7ef] text-[#0d7b51] rounded-full px-3 py-1 text-xs font-medium',
  pending: 'bg-[#fff4df] text-[#c87b22] rounded-full px-3 py-1 text-xs font-medium',
  partial: 'bg-[#fff4df] text-[#c87b22] rounded-full px-3 py-1 text-xs font-medium',
  absent: 'bg-[#fff0ee] text-[#d84b3f] rounded-full px-3 py-1 text-xs font-medium',
  present: 'bg-[#eaf7ef] text-[#0d7b51] rounded-full px-3 py-1 text-xs font-medium',
} as const

export const card = 'rounded-xl shadow-sm bg-white p-4' as const

// ── Avatar color palette (cycle through for student initials) ──
export const avatarColors = [
  '#0d7b51',
  '#c87b22',
  '#1565C0',
  '#6A1B9A',
  '#00838F',
  '#C62828',
  '#4E342E',
  '#AD1457',
] as const

export function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length]
}

// ── Icon sizes ──────────────────────────────────────────
export const iconSize = {
  nav: 24,
  header: 24,
  card: 20,
} as const
