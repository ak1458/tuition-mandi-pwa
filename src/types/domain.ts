export type AttendanceStatus = 'present' | 'absent'
export type FeeStatus = 'pending' | 'partial' | 'paid'

export interface Batch {
  id: string
  teacher_id: string
  name: string
  class_label: string
  subject: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  teacher_id: string
  full_name: string
  class_label: string
  subject: string
  monthly_fee: number
  guardian_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  teacher_id: string
  month_start: string
  total_students: number
  present_today: number
  fees_collected: number
  fee_pending_count: number
}
