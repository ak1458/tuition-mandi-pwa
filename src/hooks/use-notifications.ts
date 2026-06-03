import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  listNotifications,
  markAllRead as markAllReadStore,
  markRead as markReadStore,
  onNotificationsChange,
  removeNotification as removeStore,
  seedTeacherNotificationsIfEmpty,
  unreadCount as unreadCountStore,
  type AppNotification,
} from '@/lib/notifications'

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
}

const EMPTY: AppNotification[] = []

export function useNotifications(userId: string | undefined): NotificationsState {
  const id = userId ?? ''

  const subscribe = useCallback(
    (callback: () => void) => onNotificationsChange(callback),
    [],
  )

  const getSnapshot = useCallback(() => {
    if (!id) return ''
    return localStorage.getItem(`tuition_mandi_notifications_v1:${id}`) ?? ''
  }, [id])

  const getServerSnapshot = useCallback(() => '', [])

  // Re-renders whenever the underlying localStorage value changes.
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const notifications = useMemo(() => {
    if (!id) return EMPTY
    seedTeacherNotificationsIfEmpty(id)
    return listNotifications(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, snapshot])

  const unread = useMemo(() => {
    if (!id) return 0
    return unreadCountStore(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, snapshot])

  return {
    notifications,
    unreadCount: unread,
    markRead: (n) => id && markReadStore(id, n),
    markAllRead: () => id && markAllReadStore(id),
    remove: (n) => id && removeStore(id, n),
  }
}
