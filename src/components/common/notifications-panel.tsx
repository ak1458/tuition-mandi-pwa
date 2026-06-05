import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Icon, IconButton, cx, type IconName } from '@/components/common/tuition-mandi-ui'
import { useNotifications } from '@/hooks/use-notifications'
import type { AppNotification, NotificationType } from '@/lib/notifications'

interface NotificationsPanelProps {
  userId: string | undefined
  open: boolean
  onClose: () => void
}

const ICON_BY_TYPE: Record<NotificationType, IconName> = {
  inquiry: 'message',
  fee: 'rupee',
  attendance: 'clipboard',
  report: 'report',
  system: 'bell',
}

const TONE_BY_TYPE: Record<NotificationType, string> = {
  inquiry: 'bg-[#f1edff] text-marigold-deep',
  fee: 'bg-[#fff4df] text-[#c87b22]',
  attendance: 'bg-leaf-wash text-leaf',
  report: 'bg-coral-wash text-coral',
  system: 'bg-paper text-ink-soft',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr`
  const days = Math.floor(hours / 24)
  return `${days} d`
}

function NotificationRow({
  notification,
  onClick,
  onRemove,
}: {
  notification: AppNotification
  onClick: () => void
  onRemove: () => void
}) {
  return (
    <article
      className={cx(
        'relative flex items-start gap-3 rounded-[16px] border px-3 py-3 transition',
        notification.is_read ? 'border-line bg-surface' : 'border-[#fcefd2] bg-marigold-wash',
      )}
    >
      <button
        aria-label="Open notification"
        className="flex flex-1 min-w-0 items-start gap-3 text-left"
        onClick={onClick}
        type="button"
      >
        <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', TONE_BY_TYPE[notification.type])}>
          <Icon className="h-4 w-4" name={ICON_BY_TYPE[notification.type]} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-ink">{notification.title}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-ink-2">{notification.body}</p>
          <p className="mt-1 text-[10px] font-bold text-ink-soft">{timeAgo(notification.created_at)} ago</p>
        </div>
      </button>
      <button
        aria-label="Dismiss"
        className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-paper"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        type="button"
      >
        <span className="text-base leading-none">&times;</span>
      </button>
    </article>
  )
}

export function NotificationsPanel({ userId, open, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications(userId)

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  const handleOpen = (notification: AppNotification) => {
    if (!notification.is_read) markRead(notification.id)
    if (notification.link) {
      onClose()
      navigate(notification.link)
    }
  }

  return (
    <div aria-modal className="fixed inset-0 z-[60]" role="dialog">
      <div className="absolute inset-0 bg-[rgba(20,12,4,0.4)]" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-paper shadow-[-12px_0_32px_rgba(53,38,22,0.18)]">
        <header className="flex items-center justify-between border-b border-[#efe4d6] bg-surface px-4 py-3">
          <div>
            <h2 className="text-base font-black text-ink">Notifications</h2>
            <p className="text-[11px] font-semibold text-ink-soft">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[11px] font-black text-marigold-deep"
                onClick={markAllRead}
                type="button"
              >
                Mark all read
              </button>
            )}
            <IconButton className="h-9 w-9" label="Close notifications" onClick={onClose}>
              <span className="text-lg leading-none">&times;</span>
            </IconButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {notifications.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface p-8 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink-soft">
                <Icon className="h-7 w-7" name="bell" />
              </div>
              <p className="mt-4 text-sm font-black text-ink">Koi notification nahi hai</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                Jab koi parent inquiry kare ya fee update ho, yahan dikhega.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleOpen(notification)}
                  onRemove={() => remove(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

interface NotificationsBellProps {
  userId: string | undefined
  onOpen: () => void
}

export function NotificationsBell({ userId, onOpen }: NotificationsBellProps) {
  const { unreadCount } = useNotifications(userId)
  return (
    <IconButton className="relative h-9 w-9" label="Notifications" onClick={onOpen}>
      <Icon className="h-4 w-4" name="bell" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#e14b36] px-1 text-[9px] font-black text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </IconButton>
  )
}
