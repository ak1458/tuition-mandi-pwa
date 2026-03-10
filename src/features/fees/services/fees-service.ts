import { isLocalMode } from '@/lib/env'
import { getLocalState, makeLocalId, setLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'
import type { FeeStatus } from '@/types/domain'

export interface FeeRow {
  studentId: string
  fullName: string
  classLabel: string
  amountDue: number
  amountPaid: number
  status: FeeStatus
}

export interface FeeMutationPayload {
  teacherId: string
  studentId: string
  feeMonth: string
  amountDue: number
  amountPaid: number
}

export interface FeeSummary {
  totalCollected: number
  totalDue: number
  paidCount: number
  partialCount: number
  pendingCount: number
}

export function toMonthStart(value: string): string {
  if (value.length === 7) {
    return `${value}-01`
  }
  return value
}

export function resolveFeeStatus(amountDue: number, amountPaid: number): FeeStatus {
  if (amountPaid <= 0) return 'pending'
  if (amountPaid >= amountDue) return 'paid'
  return 'partial'
}

export async function getFeeRows(teacherId: string, feeMonth: string): Promise<FeeRow[]> {
  const monthStart = toMonthStart(feeMonth)

  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const activeStudents = state.students
      .filter((student) => student.teacher_id === teacherId && student.is_active)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))

    return activeStudents.map((student) => {
      const record = state.fee_records.find(
        (row) => row.teacher_id === teacherId && row.student_id === student.id && row.fee_month === monthStart,
      )
      const amountDue = record?.amount_due ?? Number(student.monthly_fee)
      const amountPaid = record?.amount_paid ?? 0
      const status = record?.status ?? resolveFeeStatus(amountDue, amountPaid)

      return {
        studentId: student.id,
        fullName: student.full_name,
        classLabel: student.class_label,
        amountDue,
        amountPaid,
        status,
      }
    })
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id,full_name,class_label,monthly_fee')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (studentsError) {
    throw new Error(studentsError.message)
  }

  const { data: records, error: recordsError } = await supabase
    .from('fee_records')
    .select('student_id,amount_due,amount_paid,status')
    .eq('teacher_id', teacherId)
    .eq('fee_month', monthStart)

  if (recordsError) {
    throw new Error(recordsError.message)
  }

  const recordMap = new Map<string, { amount_due: number; amount_paid: number; status: FeeStatus }>()
  for (const record of records ?? []) {
    recordMap.set(record.student_id as string, {
      amount_due: Number(record.amount_due),
      amount_paid: Number(record.amount_paid),
      status: record.status as FeeStatus,
    })
  }

  return (students ?? []).map((student) => {
    const existing = recordMap.get(student.id as string)
    const amountDue = existing?.amount_due ?? Number(student.monthly_fee)
    const amountPaid = existing?.amount_paid ?? 0
    const status = existing?.status ?? resolveFeeStatus(amountDue, amountPaid)
    return {
      studentId: student.id as string,
      fullName: student.full_name as string,
      classLabel: student.class_label as string,
      amountDue,
      amountPaid,
      status,
    }
  })
}

export function buildFeeSummary(rows: FeeRow[]): FeeSummary {
  const summary: FeeSummary = {
    totalCollected: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0,
  }

  for (const row of rows) {
    summary.totalCollected += row.amountPaid
    summary.totalDue += Math.max(row.amountDue - row.amountPaid, 0)
    if (row.status === 'paid') summary.paidCount += 1
    if (row.status === 'partial') summary.partialCount += 1
    if (row.status === 'pending') summary.pendingCount += 1
  }

  return summary
}

export async function saveFeeMutation(payload: FeeMutationPayload): Promise<void> {
  const amountPaid = Number(payload.amountPaid)
  const amountDue = Number(payload.amountDue)
  const status = resolveFeeStatus(amountDue, amountPaid)
  const paidOn = status === 'paid' ? new Date().toISOString().slice(0, 10) : null
  const monthStart = toMonthStart(payload.feeMonth)

  if (isLocalMode) {
    const state = getLocalState(payload.teacherId)
    const existing = state.fee_records.find(
      (row) => row.teacher_id === payload.teacherId && row.student_id === payload.studentId && row.fee_month === monthStart,
    )

    if (existing) {
      existing.amount_due = amountDue
      existing.amount_paid = amountPaid
      existing.status = status
      existing.paid_on = paidOn
    } else {
      state.fee_records.push({
        id: makeLocalId('fee'),
        teacher_id: payload.teacherId,
        student_id: payload.studentId,
        fee_month: monthStart,
        amount_due: amountDue,
        amount_paid: amountPaid,
        status,
        paid_on: paidOn,
        notes: null,
      })
    }

    setLocalState(payload.teacherId, state)
    return
  }

  const { error } = await supabase.from('fee_records').upsert(
    {
      teacher_id: payload.teacherId,
      student_id: payload.studentId,
      fee_month: monthStart,
      amount_due: amountDue,
      amount_paid: amountPaid,
      status,
      paid_on: paidOn,
    },
    {
      onConflict: 'student_id,fee_month',
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}
