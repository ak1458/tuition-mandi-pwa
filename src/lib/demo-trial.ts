/**
 * Automatic 3-day demo trial.
 *
 * Every new student starts in a 72-hour trial window. This is purely derived
 * from `created_at`, no schema or background job needed - the timestamp is
 * already on every Student row.
 *
 * Surfaces:
 *  - Students list: shows "Demo - Xd left" badge instead of "Present"
 *  - Attendance row: shows demo chip on trial-period students
 *  - Reports / WhatsApp message to parent: includes trial line
 *  - Dashboard: shows count of active demo students
 *  - Toast on student creation
 *
 * Edge cases:
 *  - createdAt in the future (clock skew): treat as in-trial
 *  - createdAt invalid: treat as expired (no badge)
 */

export const DEMO_TRIAL_DURATION_HOURS = 72
export const DEMO_TRIAL_DURATION_MS = DEMO_TRIAL_DURATION_HOURS * 60 * 60 * 1000

export interface DemoTrialStatus {
  isActive: boolean
  hoursRemaining: number
  daysRemaining: number
  percentElapsed: number
  expiresAt: Date | null
}

const EXPIRED: DemoTrialStatus = {
  isActive: false,
  hoursRemaining: 0,
  daysRemaining: 0,
  percentElapsed: 100,
  expiresAt: null,
}

/**
 * Compute trial status for a student given their creation timestamp.
 * Pass `now` to make tests deterministic; defaults to wall clock.
 */
export function getDemoTrialStatus(
  createdAt: string | Date | null | undefined,
  now: Date = new Date(),
): DemoTrialStatus {
  if (!createdAt) return EXPIRED

  const created = createdAt instanceof Date ? createdAt : new Date(createdAt)
  if (Number.isNaN(created.getTime())) return EXPIRED

  const expiresAt = new Date(created.getTime() + DEMO_TRIAL_DURATION_MS)
  const elapsedMs = now.getTime() - created.getTime()

  // Clock skew: createdAt in the future -> treat as a fresh trial.
  const safeElapsed = Math.max(0, elapsedMs)

  if (safeElapsed >= DEMO_TRIAL_DURATION_MS) {
    return { ...EXPIRED, expiresAt }
  }

  const remainingMs = DEMO_TRIAL_DURATION_MS - safeElapsed
  const hoursRemaining = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)))
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)))
  const percentElapsed = Math.min(100, Math.round((safeElapsed / DEMO_TRIAL_DURATION_MS) * 100))

  return {
    isActive: true,
    hoursRemaining,
    daysRemaining,
    percentElapsed,
    expiresAt,
  }
}

export function isInDemoTrial(createdAt: string | Date | null | undefined, now?: Date): boolean {
  return getDemoTrialStatus(createdAt, now).isActive
}

/**
 * Short label for the badge, e.g. "2d left", "18h left".
 * Uses days when >= 24h remain, hours otherwise. Always positive while active.
 */
export function formatTrialRemainingShort(status: DemoTrialStatus): string {
  if (!status.isActive) return ''
  if (status.hoursRemaining >= 24) {
    return `${status.daysRemaining}d left`
  }
  return `${status.hoursRemaining}h left`
}

/**
 * Sentence-shaped string for inclusion in a WhatsApp message.
 * Translatable via the `template` argument; placeholders {{remaining}} and
 * {{unit}} get substituted.
 */
export function formatTrialMessage(status: DemoTrialStatus, template: string): string {
  if (!status.isActive) return ''
  const useDays = status.hoursRemaining >= 24
  const remaining = useDays ? status.daysRemaining : status.hoursRemaining
  const unit = useDays ? 'd' : 'h'
  return template.replace('{{remaining}}', String(remaining)).replace('{{unit}}', unit)
}

/** Convenience: count students currently in trial. */
export function countActiveDemoTrials<T extends { created_at: string }>(
  students: T[],
  now?: Date,
): number {
  return students.reduce((acc, s) => acc + (isInDemoTrial(s.created_at, now) ? 1 : 0), 0)
}
