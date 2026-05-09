/**
 * Takhti Design System — Tokens
 * Extracted from Stitch design (project/12697994044832797708)
 * All UI components must import from here. No hardcoded color values in components.
 */

// ── Colors ──────────────────────────────────────────────
export const colors = {
  primary: '#1B8A3E',
  primaryContainer: '#15863b',
  primaryLight: '#E8F5E9',
  onPrimary: '#ffffff',

  danger: '#E53935',
  dangerLight: '#FFEBEE',

  warning: '#E65100',
  warningLight: '#FFF3E0',

  whatsapp: '#25D366',

  bgPage: '#F5F5F5',
  bgCard: '#FFFFFF',

  textPrimary: '#1A1A1A',
  textSecondary: '#757575',

  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  navActive: '#1B8A3E',
  navInactive: '#9E9E9E',
} as const

// ── Component class presets ─────────────────────────────
export const btn = {
  primary:
    'bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#15732F] disabled:opacity-50',
  whatsapp:
    'bg-[#25D366] text-white rounded-xl py-3 w-full font-semibold text-sm flex items-center justify-center gap-2',
  secondary:
    'border border-[#1B8A3E] text-[#1B8A3E] bg-white rounded-xl py-3 w-full font-semibold text-sm',
  danger:
    'bg-[#E53935] text-white rounded-xl py-3 w-full font-semibold text-sm',
} as const

export const pill = {
  paid: 'bg-[#E8F5E9] text-[#1B8A3E] rounded-full px-3 py-1 text-xs font-medium',
  pending: 'bg-[#FFF3E0] text-[#E65100] rounded-full px-3 py-1 text-xs font-medium',
  partial: 'bg-[#FFF3E0] text-[#E65100] rounded-full px-3 py-1 text-xs font-medium',
  absent: 'bg-[#FFEBEE] text-[#E53935] rounded-full px-3 py-1 text-xs font-medium',
  present: 'bg-[#E8F5E9] text-[#1B8A3E] rounded-full px-3 py-1 text-xs font-medium',
} as const

export const card = 'rounded-xl shadow-sm bg-white p-4' as const

// ── Avatar color palette (cycle through for student initials) ──
export const avatarColors = [
  '#1B8A3E',
  '#E65100',
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
