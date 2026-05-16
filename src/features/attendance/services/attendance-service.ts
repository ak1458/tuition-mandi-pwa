import { isLocalMode } from '@/lib/env'
import { getLocalState, makeLocalId, setLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'
import type { AttendanceStatus, Batch } from '@/types/domain'

export interface AttendanceStudent {
  id: string
  full_name: string
  class_label: string
  created_at?: string
}

export interface AttendanceEntry {
  studentId: string
  status: AttendanceStatus
}

export interface AttendanceMutationPayload {
  teacherId: string
  batchId: string
  sessionDate: string
  entries: AttendanceEntry[]
}

export async function getAttendanceBatches(teacherId: string): Promise<Batch[]> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    return state.batches
      .filter((batch) => batch.teacher_id === teacherId && batch.is_active)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Batch[]
}

export async function getStudentsByBatch(teacherId: string, batchId: string): Promise<AttendanceStudent[]> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const ids = new Set(
      state.batch_students
        .filter((row) => row.teacher_id === teacherId && row.batch_id === batchId)
        .map((row) => row.student_id),
    )
    return state.students
      .filter((student) => student.teacher_id === teacherId && ids.has(student.id))
      .map((student) => ({
        id: student.id,
        full_name: student.full_name,
        class_label: student.class_label,
        created_at: student.created_at,
      }))
  }

  const { data, error } = await supabase
    .from('batch_students')
    .select('students!inner(id,full_name,class_label,created_at)')
    .eq('teacher_id', teacherId)
    .eq('batch_id', batchId)

  if (error) {
    throw new Error(error.message)
  }

  const students: AttendanceStudent[] = []
  for (const row of data ?? []) {
    const value = row.students as unknown
    if (Array.isArray(value)) {
      for (const entry of value) {
        students.push(entry as AttendanceStudent)
      }
    } else if (value) {
      students.push(value as AttendanceStudent)
    }
  }

  return students
}

export async function getAttendanceStatusMap(
  teacherId: string,
  batchId: string,
  sessionDate: string,
): Promise<Record<string, AttendanceStatus>> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const session = state.attendance_sessions.find(
      (row) => row.teacher_id === teacherId && row.batch_id === batchId && row.session_date === sessionDate,
    )
    if (!session) return {}

    const map: Record<string, AttendanceStatus> = {}
    state.attendance_records
      .filter((row) => row.teacher_id === teacherId && row.session_id === session.id)
      .forEach((row) => {
        map[row.student_id] = row.status
      })
    return map
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from('attendance_sessions')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('batch_id', batchId)
    .eq('session_date', sessionDate)
    .maybeSingle()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  if (!sessionData) {
    return {}
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .select('student_id,status')
    .eq('teacher_id', teacherId)
    .eq('session_id', sessionData.id)

  if (error) {
    throw new Error(error.message)
  }

  const map: Record<string, AttendanceStatus> = {}
  for (const row of data ?? []) {
    map[row.student_id as string] = row.status as AttendanceStatus
  }
  return map
}

export async function saveAttendanceMutation(payload: AttendanceMutationPayload): Promise<void> {
  const { teacherId, batchId, sessionDate, entries } = payload

  if (isLocalMode) {
    const state = getLocalState(teacherId)

    let session = state.attendance_sessions.find(
      (row) => row.teacher_id === teacherId && row.batch_id === batchId && row.session_date === sessionDate,
    )
    if (!session) {
      session = {
        id: makeLocalId('session'),
        teacher_id: teacherId,
        batch_id: batchId,
        session_date: sessionDate,
      }
      state.attendance_sessions.push(session)
    }

    entries.forEach((entry) => {
      const existing = state.attendance_records.find(
        (row) => row.teacher_id === teacherId && row.session_id === session.id && row.student_id === entry.studentId,
      )
      if (existing) {
        existing.status = entry.status
        existing.marked_at = new Date().toISOString()
      } else {
        state.attendance_records.push({
          id: makeLocalId('attendance'),
          teacher_id: teacherId,
          session_id: session.id,
          student_id: entry.studentId,
          status: entry.status,
          marked_at: new Date().toISOString(),
        })
      }
    })

    setLocalState(teacherId, state)
    return
  }

  const { data: session, error: sessionError } = await supabase
    .from('attendance_sessions')
    .upsert(
      {
        teacher_id: teacherId,
        batch_id: batchId,
        session_date: sessionDate,
      },
      {
        onConflict: 'batch_id,session_date',
      },
    )
    .select('id')
    .single()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  const records = entries.map((entry) => ({
    teacher_id: teacherId,
    session_id: session.id,
    student_id: entry.studentId,
    status: entry.status,
    marked_at: new Date().toISOString(),
  }))

  const { error: recordsError } = await supabase.from('attendance_records').upsert(records, {
    onConflict: 'session_id,student_id',
  })

  if (recordsError) {
    throw new Error(recordsError.message)
  }
}
