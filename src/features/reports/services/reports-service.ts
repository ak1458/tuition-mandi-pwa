import { appEnv, hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { getLocalState, makeLocalId, setLocalState } from '@/lib/local-data'
import { supabase } from '@/lib/supabase-client'

export interface ReportStudent {
  id: string
  full_name: string
  class_label: string
  subject: string
  created_at?: string
}

export interface ReportMetrics {
  attendancePercent: number
  avgScore: number
  testsDone: number
  feePendingAmount: number
}

export interface GeneratedReportResponse {
  status: 'ok' | 'error'
  report_id?: string
  report_text?: string
  attendance_percent?: number
  avg_score?: number
  tests_done?: number
  error_code?: 'AI_RATE_LIMIT' | 'AI_PROVIDER_DOWN' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UPGRADE_REQUIRED'
  user_message_hi?: string
  retry_after_seconds?: number
}

export interface InvokeAiReportInput {
  teacherId: string
  studentId: string
  reportMonth: string
  studentName: string
  classLabel: string
  subject: string
  metrics: ReportMetrics
  language: 'en' | 'hi' | 'hi-roman'
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
}

export async function listReportStudents(teacherId: string): Promise<ReportStudent[]> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    return state.students
      .filter((student) => student.teacher_id === teacherId && student.is_active)
      .map((student) => ({
        id: student.id,
        full_name: student.full_name,
        class_label: student.class_label,
        subject: student.subject,
        created_at: student.created_at,
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }

  const { data, error } = await supabase
    .from('students')
    .select('id,full_name,class_label,subject,created_at')
    .eq('teacher_id', teacherId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ReportStudent[]
}

function monthWindow(monthStart: string) {
  const start = new Date(monthStart)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  return {
    monthStart,
    monthEnd: end.toISOString().slice(0, 10),
  }
}

export async function getReportMetrics(
  teacherId: string,
  studentId: string,
  monthStart: string,
): Promise<ReportMetrics> {
  const { monthEnd } = monthWindow(monthStart)

  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const sessionIdsInMonth = new Set(
      state.attendance_sessions
        .filter((session) => session.teacher_id === teacherId && session.session_date >= monthStart && session.session_date <= monthEnd)
        .map((session) => session.id),
    )

    const attendanceRows = state.attendance_records.filter(
      (row) => row.teacher_id === teacherId && row.student_id === studentId && sessionIdsInMonth.has(row.session_id),
    )
    const totalAttendance = attendanceRows.length
    const presentCount = attendanceRows.filter((row) => row.status === 'present').length
    const attendancePercent = totalAttendance === 0 ? 0 : Number(((presentCount / totalAttendance) * 100).toFixed(2))

    const assessmentRows = state.assessments.filter(
      (row) =>
        row.teacher_id === teacherId &&
        row.student_id === studentId &&
        row.assessment_date >= monthStart &&
        row.assessment_date <= monthEnd,
    )

    const testsDone = assessmentRows.length
    const avgScore =
      testsDone === 0
        ? 0
        : Number(
          (
            assessmentRows.reduce((acc, row) => acc + (Number(row.score) / Number(row.max_score || 100)) * 100, 0) /
            testsDone
          ).toFixed(2),
        )

    return {
      attendancePercent,
      avgScore,
      testsDone,
      feePendingAmount: 0,
    }
  }

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from('attendance_records')
    .select('status, attendance_sessions!inner(session_date)')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .gte('attendance_sessions.session_date', monthStart)
    .lte('attendance_sessions.session_date', monthEnd)

  if (attendanceError) {
    throw new Error(attendanceError.message)
  }

  const totalAttendance = (attendanceRows ?? []).length
  const presentCount = (attendanceRows ?? []).filter((row) => row.status === 'present').length
  const attendancePercent = totalAttendance === 0 ? 0 : Number(((presentCount / totalAttendance) * 100).toFixed(2))

  const { data: assessmentRows, error: assessmentError } = await supabase
    .from('assessments')
    .select('score,max_score')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .gte('assessment_date', monthStart)
    .lte('assessment_date', monthEnd)

  if (assessmentError) {
    throw new Error(assessmentError.message)
  }

  const testsDone = (assessmentRows ?? []).length
  const avgScore =
    testsDone === 0
      ? 0
      : Number(
        (
          (assessmentRows ?? []).reduce((acc, row) => acc + (Number(row.score) / Number(row.max_score || 100)) * 100, 0) /
          testsDone
        ).toFixed(2),
      )

  const { data: studentData } = await supabase
    .from('students')
    .select('monthly_fee')
    .eq('id', studentId)
    .single()
    
  const { data: feeData } = await supabase
    .from('fee_records')
    .select('amount_due, amount_paid')
    .eq('student_id', studentId)
    .eq('fee_month', monthStart)
    .maybeSingle()

  const monthlyFee = Number(studentData?.monthly_fee || 0)
  const amountDue = feeData?.amount_due ?? monthlyFee
  const amountPaid = feeData?.amount_paid ?? 0
  const feePendingAmount = Math.max(amountDue - amountPaid, 0)

  return {
    attendancePercent,
    avgScore,
    testsDone,
    feePendingAmount,
  }
}

export function generateManualTemplate(studentName: string, metrics: ReportMetrics): string {
  const attendanceLine =
    metrics.attendancePercent >= 85
      ? 'attendance bahut acchi rahi.'
      : metrics.attendancePercent >= 60
        ? 'attendance theek rahi, thoda aur regular rehna hoga.'
        : 'attendance me sudhaar ki zaroorat hai.'

  const scoreLine =
    metrics.avgScore >= 80
      ? 'test performance strong hai.'
      : metrics.avgScore >= 60
        ? 'test performance average hai, focused revision helpful rahega.'
        : 'test scores improve karne ke liye extra practice chahiye.'

  return `${studentName} ke liye mahine ki progress update: Attendance ${metrics.attendancePercent}% rahi aur average score ${metrics.avgScore}% hai. Is mahine ${metrics.testsDone} test complete huye. ${attendanceLine} ${scoreLine}`
}

export async function saveManualReport(
  teacherId: string,
  studentId: string,
  monthStart: string,
  metrics: ReportMetrics,
  reportText: string,
): Promise<void> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    state.progress_reports.push({
      id: makeLocalId('report'),
      teacher_id: teacherId,
      student_id: studentId,
      report_month: monthStart,
      attendance_percent: metrics.attendancePercent,
      avg_score: metrics.avgScore,
      tests_done: metrics.testsDone,
      language: 'hi',
      report_text: reportText,
      generated_by: 'manual_template',
      generated_at: new Date().toISOString(),
      shared_via_whatsapp: false,
    })
    setLocalState(teacherId, state)
    return
  }

  const { error } = await supabase.from('progress_reports').insert({
    teacher_id: teacherId,
    student_id: studentId,
    report_month: monthStart,
    attendance_percent: metrics.attendancePercent,
    avg_score: metrics.avgScore,
    tests_done: metrics.testsDone,
    language: 'hi',
    report_text: reportText,
    generated_by: 'manual_template',
    shared_via_whatsapp: false,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchLatestReport(teacherId: string, studentId: string, monthStart: string): Promise<string | null> {
  if (isLocalMode) {
    const state = getLocalState(teacherId)
    const reports = state.progress_reports
      .filter((row) => row.teacher_id === teacherId && row.student_id === studentId && row.report_month === monthStart)
      .sort((a, b) => b.generated_at.localeCompare(a.generated_at))

    return reports[0]?.report_text ?? null
  }

  const { data, error } = await supabase
    .from('progress_reports')
    .select('report_text')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .eq('report_month', monthStart)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data?.report_text as string | undefined) ?? null
}

function buildOpenRouterPrompt(input: InvokeAiReportInput): string {
  let langInstruction = 'Hindi me (Devanagari script) parent-friendly report likho.'
  if (input.language === 'en') {
    langInstruction = 'Write a parent-friendly report in English.'
  } else if (input.language === 'hi-roman') {
    langInstruction = 'Roman Hindi (Hinglish alphabet) me parent-friendly report likho.'
  }

  return [
    `You are a tuition teacher assistant. ${langInstruction}`,
    'Rules:',
    '1) Use only the provided data. Do not make up any new facts or scores.',
    '2) Keep the tone warm, encouraging, and professional.',
    "3) If attendance is below 50%, include a phrase like 'needs a bit more effort in regular attendance'.",
    '',
    `Student: ${input.studentName}`,
    `Class: ${input.classLabel}`,
    `Subject: ${input.subject}`,
    `Month: ${input.reportMonth}`,
    `Attendance: ${input.metrics.attendancePercent}%`,
    `Average Score: ${input.metrics.avgScore}%`,
    `Tests Done: ${input.metrics.testsDone}`,
    '',
    'Provide an 80-120 words plain text report.',
  ].join('\n')
}

/**
 * QwQ-32b wraps reasoning inside <think>...</think> blocks.
 * Strip those so only the final report text is returned.
 */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

function parseOpenRouterText(payload: OpenRouterResponse): string {
  const content = payload.choices?.[0]?.message?.content
  let raw = ''
  if (typeof content === 'string') {
    raw = content.trim()
  } else if (Array.isArray(content)) {
    raw = content
      .map((part) => part.text ?? '')
      .join('\n')
      .trim()
  }
  return stripThinkTags(raw)
}

async function saveAiReport(input: InvokeAiReportInput, reportText: string): Promise<string> {
  if (isLocalMode) {
    const state = getLocalState(input.teacherId)
    const reportId = makeLocalId('report')
    state.progress_reports.push({
      id: reportId,
      teacher_id: input.teacherId,
      student_id: input.studentId,
      report_month: input.reportMonth,
      attendance_percent: input.metrics.attendancePercent,
      avg_score: input.metrics.avgScore,
      tests_done: input.metrics.testsDone,
      language: input.language,
      report_text: reportText,
      generated_by: 'openrouter',
      generated_at: new Date().toISOString(),
      shared_via_whatsapp: false,
    })
    setLocalState(input.teacherId, state)
    return reportId
  }

  if (!hasSupabaseConfig) {
    throw new Error('SUPABASE_CONFIG_MISSING')
  }

  const { data, error } = await supabase
    .from('progress_reports')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      report_month: input.reportMonth,
      attendance_percent: input.metrics.attendancePercent,
      avg_score: input.metrics.avgScore,
      tests_done: input.metrics.testsDone,
      language: input.language,
      report_text: reportText,
      generated_by: 'openrouter',
      shared_via_whatsapp: false,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.id as string
}

async function invokeOpenRouter(input: InvokeAiReportInput): Promise<GeneratedReportResponse> {
  if (!appEnv.openRouterApiKey) {
    return {
      status: 'error',
      error_code: 'AI_PROVIDER_DOWN',
      user_message_hi: 'Report seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appEnv.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': appEnv.openRouterReferer,
        'X-Title': appEnv.openRouterTitle,
      },
      body: JSON.stringify({
        model: appEnv.openRouterModel,
        messages: [
          {
            role: 'user',
            content: buildOpenRouterPrompt(input),
          },
        ],
        temperature: 0.7,
      }),
    })

    if (response.status === 429) {
      const retryHeader = response.headers.get('retry-after')
      const retryAfterSeconds = retryHeader ? Number(retryHeader) || 900 : 900
      return {
        status: 'error',
        error_code: 'AI_RATE_LIMIT',
        user_message_hi: 'Abhi report generate nahi ho pa rahi, thodi der mein try karein.',
        retry_after_seconds: retryAfterSeconds,
      }
    }

    if (!response.ok) {
      return {
        status: 'error',
        error_code: 'AI_PROVIDER_DOWN',
        user_message_hi: 'Report seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
      }
    }

    const data = (await response.json()) as OpenRouterResponse
    const reportText = parseOpenRouterText(data)
    if (!reportText) {
      return {
        status: 'error',
        error_code: 'AI_PROVIDER_DOWN',
        user_message_hi: 'Report seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
      }
    }

    const reportId = await saveAiReport(input, reportText)

    return {
      status: 'ok',
      report_id: reportId,
      report_text: reportText,
      attendance_percent: input.metrics.attendancePercent,
      avg_score: input.metrics.avgScore,
      tests_done: input.metrics.testsDone,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('UPGRADE_REQUIRED')) {
      return {
        status: 'error',
        error_code: 'UPGRADE_REQUIRED',
        user_message_hi: 'Free plan me 1 report included hai. Pro plan le kar unlimited reports banayein.',
      }
    }

    return {
      status: 'error',
      error_code: 'NETWORK_ERROR',
      user_message_hi: 'Internet connection weak hai. Connection check karke phir try karein.',
    }
  }
}

export async function invokeAiReport(input: InvokeAiReportInput): Promise<GeneratedReportResponse> {
  if (isLocalMode) {
    if (appEnv.openRouterApiKey) {
      return invokeOpenRouter(input)
    }

    return {
      status: 'error',
      error_code: 'AI_PROVIDER_DOWN',
      user_message_hi: 'Report seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
    }
  }

  if (!hasSupabaseConfig) {
    return {
      status: 'error',
      error_code: 'AI_PROVIDER_DOWN',
      user_message_hi: 'Report seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
    }
  }

  const { data, error } = await supabase.functions.invoke('generate-progress-report', {
    body: {
      student_id: input.studentId,
      report_month: input.reportMonth,
      language: input.language,
    },
  })

  if (error) {
    if (error.message?.includes('UPGRADE_REQUIRED')) {
      return {
        status: 'error',
        error_code: 'UPGRADE_REQUIRED',
        user_message_hi: 'Free plan me 1 report included hai. Pro plan le kar unlimited reports banayein.',
      }
    }

    return {
      status: 'error',
      error_code: 'NETWORK_ERROR',
      user_message_hi: 'Internet connection weak hai. Connection check karke phir try karein.',
    }
  }

  return data as GeneratedReportResponse
}
