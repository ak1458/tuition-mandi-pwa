/**
 * App-wide user preferences (notification toggles, theme, share number etc.)
 * Persisted in localStorage. Per-user.
 */

export interface NotificationPreferences {
  push: boolean
  whatsapp: boolean
  email: boolean
  feeReminders: boolean
  inquiries: boolean
}

export interface UserPreferences {
  notifications: NotificationPreferences
  share_phone_with_parents: boolean
  data_collection_opt_out: boolean
}

const STORAGE_PREFIX = 'takhti_user_prefs_v1'
const CHANGE_EVENT = 'takhti:prefs:change'

export const DEFAULT_PREFS: UserPreferences = {
  notifications: {
    push: true,
    whatsapp: true,
    email: false,
    feeReminders: true,
    inquiries: true,
  },
  share_phone_with_parents: true,
  data_collection_opt_out: false,
}

function key(userId: string) {
  return `${STORAGE_PREFIX}:${userId || 'anon'}`
}

export function getPreferences(userId: string): UserPreferences {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      notifications: { ...DEFAULT_PREFS.notifications, ...(parsed.notifications ?? {}) },
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setPreferences(userId: string, prefs: UserPreferences) {
  localStorage.setItem(key(userId), JSON.stringify(prefs))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { userId } }))
}

export function onPreferencesChange(callback: () => void) {
  const local = () => callback()
  const cross = (event: StorageEvent) => {
    if (event.key && event.key.startsWith(STORAGE_PREFIX)) callback()
  }
  window.addEventListener(CHANGE_EVENT, local)
  window.addEventListener('storage', cross)
  return () => {
    window.removeEventListener(CHANGE_EVENT, local)
    window.removeEventListener('storage', cross)
  }
}
