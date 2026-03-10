import { isLocalMode } from '@/lib/env'
import { getLocalState, makeLocalId, setLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'
import type { Student } from '@/types/domain'

export interface CreateStudentInput {
  teacherId: string
  fullName: string
  classLabel: string
  subject: string
  monthlyFee: number
  guardianPhone: string
}

export async function listStudents(teacherId: string): Promise<Student[]> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    return state.students
      .filter((student) => student.teacher_id === teacherId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Student[]
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  if (isLocalMode) {
    const state = getLocalState(input.teacherId)
    const now = new Date().toISOString()
    const student: Student = {
      id: makeLocalId('student'),
      teacher_id: input.teacherId,
      full_name: input.fullName,
      class_label: input.classLabel,
      subject: input.subject,
      monthly_fee: input.monthlyFee,
      guardian_phone: input.guardianPhone || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    state.students.push(student)
    setLocalState(input.teacherId, state)
    return student
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      teacher_id: input.teacherId,
      full_name: input.fullName,
      class_label: input.classLabel,
      subject: input.subject,
      monthly_fee: input.monthlyFee,
      guardian_phone: input.guardianPhone || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('UPGRADE_REQUIRED_STUDENT_LIMIT')) {
      throw new Error('UPGRADE_REQUIRED_STUDENT_LIMIT')
    }
    throw new Error(error.message)
  }

  return data as Student
}

export async function assignStudentToBatch(teacherId: string, batchId: string, studentId: string) {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const exists = state.batch_students.some(
      (row) => row.teacher_id === teacherId && row.batch_id === batchId && row.student_id === studentId,
    )
    if (!exists) {
      state.batch_students.push({
        teacher_id: teacherId,
        batch_id: batchId,
        student_id: studentId,
      })
      setLocalState(teacherId, state)
    }
    return
  }

  const { error } = await supabase.from('batch_students').upsert(
    {
      teacher_id: teacherId,
      batch_id: batchId,
      student_id: studentId,
    },
    {
      onConflict: 'batch_id,student_id',
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}
