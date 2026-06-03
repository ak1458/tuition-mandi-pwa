import type { AttendanceStatus, Batch, FeeStatus, Student } from '@/types/domain'

interface LocalBatchStudent {
  teacher_id: string
  batch_id: string
  student_id: string
}

interface LocalAttendanceSession {
  id: string
  teacher_id: string
  batch_id: string
  session_date: string
}

interface LocalAttendanceRecord {
  id: string
  teacher_id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  marked_at: string
}

interface LocalFeeRecord {
  id: string
  teacher_id: string
  student_id: string
  fee_month: string
  amount_due: number
  amount_paid: number
  status: FeeStatus
  paid_on: string | null
  notes: string | null
}

interface LocalAssessment {
  id: string
  teacher_id: string
  student_id: string
  assessment_date: string
  title: string
  score: number
  max_score: number
}

interface LocalProgressReport {
  id: string
  teacher_id: string
  student_id: string
  report_month: string
  attendance_percent: number
  avg_score: number
  tests_done: number
  language: string
  report_text: string
  generated_by: string
  generated_at: string
  shared_via_whatsapp: boolean
}

export interface LocalDataState {
  batches: Batch[]
  students: Student[]
  batch_students: LocalBatchStudent[]
  attendance_sessions: LocalAttendanceSession[]
  attendance_records: LocalAttendanceRecord[]
  fee_records: LocalFeeRecord[]
  assessments: LocalAssessment[]
  progress_reports: LocalProgressReport[]
}

const STORAGE_PREFIX = 'tuition_mandi_local_state_v1'

function storageKey(teacherId: string) {
  return `${STORAGE_PREFIX}:${teacherId}`
}

function uid(prefix: string) {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}

function emptyState(): LocalDataState {
  return {
    batches: [],
    students: [],
    batch_students: [],
    attendance_sessions: [],
    attendance_records: [],
    fee_records: [],
    assessments: [],
    progress_reports: [],
  }
}

export function getLocalState(teacherId: string): LocalDataState {
  const key = storageKey(teacherId)
  const raw = localStorage.getItem(key)

  if (!raw) {
    const initial = emptyState()
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }

  try {
    return JSON.parse(raw) as LocalDataState
  } catch {
    const initial = emptyState()
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
}

export function setLocalState(teacherId: string, state: LocalDataState) {
  localStorage.setItem(storageKey(teacherId), JSON.stringify(state))
}

export function makeLocalId(prefix: string) {
  return uid(prefix)
}
