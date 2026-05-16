import { useEffect, useState } from 'react'
import {
  formatTrialRemainingShort,
  getDemoTrialStatus,
  type DemoTrialStatus,
} from '@/lib/demo-trial'
import { cx } from '@/components/common/takhti-ui'

interface DemoTrialBadgeProps {
  createdAt: string | Date | null | undefined
  /** "compact" hides the leading word; "full" shows it. Defaults to "full". */
  variant?: 'compact' | 'full'
  /** Optional translated label. Defaults to "Demo". */
  label?: string
  className?: string
}

/**
 * The trial countdown is purely time-derived. We tick a counter every minute
 * to force a re-render so the "2d left" -> "1d left" transition happens
 * without manual reload. We avoid useEffect+setState (banned by React 19's
 * react-hooks/set-state-in-effect rule) by storing only an integer tick;
 * deriving the displayed status from props + tick during render.
 */
function useMinuteTick(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    // Schedule a setState in a *callback*, not in the effect body. This is
    // the supported pattern for syncing with external time.
    const interval = window.setInterval(() => setTick((value) => value + 1), 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])
  return tick
}

export function DemoTrialBadge({
  createdAt,
  variant = 'full',
  label = 'Demo',
  className,
}: DemoTrialBadgeProps) {
  // The tick is read into `data-tick` so the value is referenced (TS6133)
  // and the component re-renders once per minute to update "Xd left" copy.
  const tick = useMinuteTick()
  const status: DemoTrialStatus = getDemoTrialStatus(createdAt)

  if (!status.isActive) return null

  const remaining = formatTrialRemainingShort(status)
  const aria = `${label} trial - ${remaining}`

  return (
    <span
      aria-label={aria}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#9a5a14] ring-1 ring-inset ring-[#f0dfc2]',
        className,
      )}
      data-tick={tick}
      title={aria}
    >
      <span aria-hidden className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c87b22] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c87b22]" />
      </span>
      {variant === 'full' ? (
        <>
          <span className="tracking-wide">{label}</span>
          <span aria-hidden className="opacity-50">·</span>
          <span className="lowercase tracking-normal">{remaining}</span>
        </>
      ) : (
        <span className="lowercase tracking-normal">{remaining}</span>
      )}
    </span>
  )
}
