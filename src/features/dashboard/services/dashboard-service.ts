import { isLocalMode } from '@/lib/env'
import { getLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'
import type { DashboardSummary } from '@/types/domain'

const emptySummary: Omit<DashboardSummary, 'teacher_id'> = {
  month_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  total_students: 0,
  present_today: 0,
  fees_collected: 0,
  fee_pending_count: 0,
}

export async function getDashboardSummary(teacherId: string): Promise<DashboardSummary> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

    const activeStudents = state.students.filter((student) => student.teacher_id === teacherId && student.is_active)
    const todaySessionIds = new Set(
      state.attendance_sessions
        .filter((session) => session.teacher_id === teacherId && session.session_date === today)
        .map((session) => session.id),
    )

    const presentToday = state.attendance_records.filter(
      (record) =>
        record.teacher_id === teacherId && todaySessionIds.has(record.session_id) && record.status === 'present',
    ).length

    const monthlyFees = state.fee_records.filter((row) => row.teacher_id === teacherId && row.fee_month === monthStart)
    const feesCollected = monthlyFees.reduce((sum, row) => sum + Number(row.amount_paid), 0)
    const feePendingCount = monthlyFees.filter((row) => row.status !== 'paid').length

    return {
      teacher_id: teacherId,
      month_start: monthStart,
      total_students: activeStudents.length,
      present_today: presentToday,
      fees_collected: Number(feesCollected.toFixed(2)),
      fee_pending_count: feePendingCount,
    }
  }

  const { data, error } = await supabase
    .from('dashboard_monthly_summary')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return {
      teacher_id: teacherId,
      ...emptySummary,
    }
  }

  return data as DashboardSummary
}
