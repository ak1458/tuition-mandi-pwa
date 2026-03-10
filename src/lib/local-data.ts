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

const STORAGE_PREFIX = 'takhti_local_state_v1'

function storageKey(teacherId: string) {
  return `${STORAGE_PREFIX}:${teacherId}`
}

function nowIso() {
  return new Date().toISOString()
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10)
}

function monthStart(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1).toISOString().slice(0, 10)
}

function uid(prefix: string) {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}

function seedState(teacherId: string): LocalDataState {
  const now = nowIso()
  const currentMonth = monthStart(new Date())
  const previousMonthDate = new Date()
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
  const previousMonth = monthStart(previousMonthDate)

  const batches: Batch[] = [
    {
      id: 'batch-a',
      teacher_id: teacherId,
      name: 'Batch A',
      class_label: 'Class 10',
      subject: 'Maths',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'batch-b',
      teacher_id: teacherId,
      name: 'Batch B',
      class_label: 'Class 9',
      subject: 'Science',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  const students: Student[] = [
    {
      id: 'student-1',
      teacher_id: teacherId,
      full_name: 'Priya Sharma',
      class_label: 'Class 10',
      subject: 'Maths',
      monthly_fee: 1500,
      guardian_phone: '+919810000001',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-2',
      teacher_id: teacherId,
      full_name: 'Rahul Verma',
      class_label: 'Class 10',
      subject: 'Maths',
      monthly_fee: 1500,
      guardian_phone: '+919810000002',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-3',
      teacher_id: teacherId,
      full_name: 'Anjali Singh',
      class_label: 'Class 10',
      subject: 'Maths',
      monthly_fee: 1500,
      guardian_phone: '+919810000003',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-4',
      teacher_id: teacherId,
      full_name: 'Rohan Gupta',
      class_label: 'Class 10',
      subject: 'Maths',
      monthly_fee: 1500,
      guardian_phone: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-5',
      teacher_id: teacherId,
      full_name: 'Nisha Yadav',
      class_label: 'Class 9',
      subject: 'Science',
      monthly_fee: 1200,
      guardian_phone: '+919810000005',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-6',
      teacher_id: teacherId,
      full_name: 'Aman Mishra',
      class_label: 'Class 9',
      subject: 'Science',
      monthly_fee: 1200,
      guardian_phone: '+919810000006',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-7',
      teacher_id: teacherId,
      full_name: 'Sana Khan',
      class_label: 'Class 9',
      subject: 'Science',
      monthly_fee: 1200,
      guardian_phone: '+919810000007',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'student-8',
      teacher_id: teacherId,
      full_name: 'Karan Patel',
      class_label: 'Class 9',
      subject: 'Science',
      monthly_fee: 1200,
      guardian_phone: '+919810000008',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]

  const batch_students: LocalBatchStudent[] = [
    { teacher_id: teacherId, batch_id: 'batch-a', student_id: 'student-1' },
    { teacher_id: teacherId, batch_id: 'batch-a', student_id: 'student-2' },
    { teacher_id: teacherId, batch_id: 'batch-a', student_id: 'student-3' },
    { teacher_id: teacherId, batch_id: 'batch-a', student_id: 'student-4' },
    { teacher_id: teacherId, batch_id: 'batch-b', student_id: 'student-5' },
    { teacher_id: teacherId, batch_id: 'batch-b', student_id: 'student-6' },
    { teacher_id: teacherId, batch_id: 'batch-b', student_id: 'student-7' },
    { teacher_id: teacherId, batch_id: 'batch-b', student_id: 'student-8' },
  ]

  const attendance_sessions: LocalAttendanceSession[] = []
  const attendance_records: LocalAttendanceRecord[] = []
  for (let offset = 0; offset < 30; offset += 1) {
    const day = new Date()
    day.setDate(day.getDate() - offset)
    const sessionDate = toDateString(day)

    const sessionAId = `session-a-${sessionDate}`
    const sessionBId = `session-b-${sessionDate}`

    attendance_sessions.push({
      id: sessionAId,
      teacher_id: teacherId,
      batch_id: 'batch-a',
      session_date: sessionDate,
    })
    attendance_sessions.push({
      id: sessionBId,
      teacher_id: teacherId,
      batch_id: 'batch-b',
      session_date: sessionDate,
    })

    const batchAStatuses: Record<string, AttendanceStatus> = {
      'student-1': 'present',
      'student-2': 'absent',
      'student-3': offset % 2 === 0 ? 'present' : 'absent',
      'student-4': offset % 3 === 0 ? 'absent' : 'present',
    }

    const batchBStatuses: Record<string, AttendanceStatus> = {
      'student-5': offset % 4 === 0 ? 'absent' : 'present',
      'student-6': offset % 5 === 0 ? 'absent' : 'present',
      'student-7': offset % 3 === 0 ? 'present' : 'absent',
      'student-8': offset % 2 === 1 ? 'present' : 'absent',
    }

    Object.entries(batchAStatuses).forEach(([studentId, status]) => {
      attendance_records.push({
        id: uid('ar'),
        teacher_id: teacherId,
        session_id: sessionAId,
        student_id: studentId,
        status,
        marked_at: nowIso(),
      })
    })

    Object.entries(batchBStatuses).forEach(([studentId, status]) => {
      attendance_records.push({
        id: uid('ar'),
        teacher_id: teacherId,
        session_id: sessionBId,
        student_id: studentId,
        status,
        marked_at: nowIso(),
      })
    })
  }

  const fee_records: LocalFeeRecord[] = [
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-1',
      fee_month: currentMonth,
      amount_due: 1500,
      amount_paid: 1500,
      status: 'paid',
      paid_on: toDateString(new Date()),
      notes: 'Paid via UPI',
    },
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-2',
      fee_month: currentMonth,
      amount_due: 1500,
      amount_paid: 0,
      status: 'pending',
      paid_on: null,
      notes: 'Pending',
    },
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-3',
      fee_month: currentMonth,
      amount_due: 1500,
      amount_paid: 800,
      status: 'partial',
      paid_on: null,
      notes: 'Part payment',
    },
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-5',
      fee_month: currentMonth,
      amount_due: 1200,
      amount_paid: 1200,
      status: 'paid',
      paid_on: toDateString(new Date()),
      notes: null,
    },
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-1',
      fee_month: previousMonth,
      amount_due: 1500,
      amount_paid: 1500,
      status: 'paid',
      paid_on: previousMonth,
      notes: 'Previous month complete',
    },
    {
      id: uid('fee'),
      teacher_id: teacherId,
      student_id: 'student-2',
      fee_month: previousMonth,
      amount_due: 1500,
      amount_paid: 1500,
      status: 'paid',
      paid_on: previousMonth,
      notes: 'Previous month complete',
    },
  ]

  const assessments: LocalAssessment[] = [
    {
      id: uid('asmt'),
      teacher_id: teacherId,
      student_id: 'student-1',
      assessment_date: toDateString(new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)),
      title: 'Algebra Test',
      score: 88,
      max_score: 100,
    },
    {
      id: uid('asmt'),
      teacher_id: teacherId,
      student_id: 'student-1',
      assessment_date: toDateString(new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)),
      title: 'Geometry Quiz',
      score: 90,
      max_score: 100,
    },
    {
      id: uid('asmt'),
      teacher_id: teacherId,
      student_id: 'student-2',
      assessment_date: toDateString(new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)),
      title: 'Algebra Test',
      score: 42,
      max_score: 100,
    },
  ]

  const progress_reports: LocalProgressReport[] = [
    {
      id: uid('report'),
      teacher_id: teacherId,
      student_id: 'student-1',
      report_month: currentMonth,
      attendance_percent: 100,
      avg_score: 89,
      tests_done: 2,
      language: 'hi',
      report_text:
        'Priya ne is mahine bahut accha performance diya hai. Attendance strong rahi aur test scores bhi achhe rahe.',
      generated_by: 'seed_demo',
      generated_at: nowIso(),
      shared_via_whatsapp: false,
    },
  ]

  return {
    batches,
    students,
    batch_students,
    attendance_sessions,
    attendance_records,
    fee_records,
    assessments,
    progress_reports,
  }
}

export function getLocalState(teacherId: string): LocalDataState {
  const key = storageKey(teacherId)
  const raw = localStorage.getItem(key)

  if (!raw) {
    const seeded = seedState(teacherId)
    localStorage.setItem(key, JSON.stringify(seeded))
    return seeded
  }

  try {
    return JSON.parse(raw) as LocalDataState
  } catch {
    const seeded = seedState(teacherId)
    localStorage.setItem(key, JSON.stringify(seeded))
    return seeded
  }
}

export function setLocalState(teacherId: string, state: LocalDataState) {
  localStorage.setItem(storageKey(teacherId), JSON.stringify(state))
}

export function makeLocalId(prefix: string) {
  return uid(prefix)
}
