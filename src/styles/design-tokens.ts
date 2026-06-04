/**
 * TuitionMandi Design System — Tokens
 * Extracted from Stitch design (project/12697994044832797708)
 * All UI components must import from here. No hardcoded color values in components.
 */

// ── Colors ──────────────────────────────────────────────
export const colors = {
  primary: '#138a5e',
  primaryContainer: '#0e6e4b',
  primaryLight: '#dcf1e7',
  onPrimary: '#ffffff',

  danger: '#e14b36',
  dangerLight: '#fbe6e1',

  warning: '#c87b22',
  warningLight: '#fff4df',

  whatsapp: '#25D366',

  bgPage: '#f4f1ea',
  bgCard: '#FFFFFF',

  textPrimary: '#1c1916',
  textSecondary: '#847a6c',

  border: '#e5decf',
  borderLight: '#ece7dc',

  navActive: '#138a5e',
  navInactive: '#847a6c',
} as const

// ── Component class presets ─────────────────────────────
export const btn = {
  primary:
    'bg-[#138a5e] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#0e6e4b] disabled:opacity-50',
  whatsapp:
    'bg-[#25D366] text-white rounded-xl py-3 w-full font-semibold text-sm flex items-center justify-center gap-2',
  secondary:
    'border border-[#138a5e] text-[#138a5e] bg-white rounded-xl py-3 w-full font-semibold text-sm',
  danger:
    'bg-[#e14b36] text-white rounded-xl py-3 w-full font-semibold text-sm',
} as const

export const pill = {
  paid: 'bg-[#dcf1e7] text-[#138a5e] rounded-full px-3 py-1 text-xs font-medium',
  pending: 'bg-[#fff4df] text-[#c87b22] rounded-full px-3 py-1 text-xs font-medium',
  partial: 'bg-[#fff4df] text-[#c87b22] rounded-full px-3 py-1 text-xs font-medium',
  absent: 'bg-[#fbe6e1] text-[#e14b36] rounded-full px-3 py-1 text-xs font-medium',
  present: 'bg-[#dcf1e7] text-[#138a5e] rounded-full px-3 py-1 text-xs font-medium',
} as const

export const card = 'rounded-xl shadow-sm bg-white p-4' as const

// ── Avatar color palette (cycle through for student initials) ──
export const avatarColors = [
  '#138a5e',
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
