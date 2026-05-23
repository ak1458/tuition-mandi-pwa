/**
 * Notification store backed by localStorage.
 * In production, swap localStorage for Supabase Realtime + push API.
 *
 * Notifications are scoped per teacher/user. Parent-mode (no session) uses
 * a fixed `parent` namespace.
 */

export type NotificationType = 'inquiry' | 'fee' | 'attendance' | 'system' | 'report'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link?: string
  is_read: boolean
  created_at: string
}

const STORAGE_PREFIX = 'takhti_notifications_v1'
const CHANGE_EVENT = 'takhti:notifications:change'

function key(userId: string) {
  return `${STORAGE_PREFIX}:${userId || 'anon'}`
}

function readAll(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(userId: string, items: AppNotification[]) {
  localStorage.setItem(key(userId), JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { userId } }))
}

export function listNotifications(userId: string): AppNotification[] {
  return readAll(userId).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function unreadCount(userId: string): number {
  return readAll(userId).filter((n) => !n.is_read).length
}

export function pushNotification(
  userId: string,
  partial: Pick<AppNotification, 'type' | 'title' | 'body'> & { link?: string },
): AppNotification {
  const items = readAll(userId)
  const id = `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const next: AppNotification = {
    id,
    user_id: userId,
    type: partial.type,
    title: partial.title,
    body: partial.body,
    link: partial.link,
    is_read: false,
    created_at: new Date().toISOString(),
  }
  items.unshift(next)
  // cap to 50
  writeAll(userId, items.slice(0, 50))
  return next
}

export function markRead(userId: string, id: string) {
  const items = readAll(userId).map((n) => (n.id === id ? { ...n, is_read: true } : n))
  writeAll(userId, items)
}

export function markAllRead(userId: string) {
  const items = readAll(userId).map((n) => ({ ...n, is_read: true }))
  writeAll(userId, items)
}

export function clearAll(userId: string) {
  writeAll(userId, [])
}

export function removeNotification(userId: string, id: string) {
  const items = readAll(userId).filter((n) => n.id !== id)
  writeAll(userId, items)
}

/** Subscribe to live changes (cross-tab + same-tab). */
export function onNotificationsChange(callback: () => void) {
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

/**
 * Kept as an exported no-op for backwards compatibility with the
 * `useNotifications` hook. New users start with an empty notification
 * inbox; real notifications arrive via push / WhatsApp / email channels
 * configured per user preference.
 */
export function seedTeacherNotificationsIfEmpty(_userId: string): void {
  // Intentionally empty. Keep the function signature so existing callers
  // do not need to change.
  void _userId
}
