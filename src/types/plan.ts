export type PlanType = 'free' | 'pro'

export type UpgradeReason = 'student_limit' | 'ai_report'

export interface PlanState {
  plan: PlanType
  plan_expires_at: string | null
}
