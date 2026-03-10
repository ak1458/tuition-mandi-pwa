import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { errorResponse, jsonResponse, corsHeaders } from './error-map.ts'
import { buildReportPrompt } from './prompt.ts'

interface GenerateReportRequest {
  student_id?: string
  report_month?: string
  language?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
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

function parseRetryAfterSeconds(headerValue: string | null): number {
  if (!headerValue) return 900
  const parsed = Number(headerValue)
  if (!Number.isNaN(parsed)) return parsed
  return 900
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Invalid request method.', 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return errorResponse('AI_PROVIDER_DOWN', 'AI seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.', 503)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return errorResponse('VALIDATION_ERROR', 'Unauthorized request.', 401)
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  try {
    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData.user) {
      return errorResponse('VALIDATION_ERROR', 'Unauthorized request.', 401)
    }

    const userId = userData.user.id
    const body = (await request.json()) as GenerateReportRequest
    const studentId = body.student_id
    const reportMonth = body.report_month

    if (!studentId || !reportMonth) {
      return errorResponse('VALIDATION_ERROR', 'Student data adhoora hai. Kripya details update karein.', 400)
    }

    const { data: student, error: studentError } = await serviceClient
      .from('students')
      .select('id,full_name,class_label,subject')
      .eq('id', studentId)
      .eq('teacher_id', userId)
      .maybeSingle()

    if (studentError || !student) {
      return errorResponse('VALIDATION_ERROR', 'Student data adhoora hai. Kripya details update karein.', 400)
    }

    const { data: profileData, error: profileError } = await serviceClient
      .from('profiles')
      .select('plan,plan_expires_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
    }

    const rawPlan = profileData?.plan === 'pro' ? 'pro' : 'free'
    const isPlanExpired =
      rawPlan === 'pro' &&
      Boolean(profileData?.plan_expires_at) &&
      new Date(profileData?.plan_expires_at as string).getTime() < Date.now()
    const effectivePlan = isPlanExpired ? 'free' : rawPlan

    if (effectivePlan === 'free') {
      const { count: aiReportCount, error: reportCountError } = await serviceClient
        .from('progress_reports')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', userId)
        .neq('generated_by', 'manual_template')
        .neq('generated_by', 'seed_demo')

      if (reportCountError) {
        return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
      }

      if ((aiReportCount ?? 0) >= 1) {
        return errorResponse(
          'UPGRADE_REQUIRED',
          'Free plan me 1 AI report included hai. Pro plan le kar unlimited reports banayein.',
          402,
        )
      }
    }

    const { monthStart, monthEnd } = monthWindow(reportMonth)

    const { data: attendanceRows, error: attendanceError } = await serviceClient
      .from('attendance_records')
      .select('status, attendance_sessions!inner(session_date)')
      .eq('teacher_id', userId)
      .eq('student_id', studentId)
      .gte('attendance_sessions.session_date', monthStart)
      .lte('attendance_sessions.session_date', monthEnd)

    if (attendanceError) {
      return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
    }

    const totalAttendance = (attendanceRows ?? []).length
    const presentCount = (attendanceRows ?? []).filter((row) => row.status === 'present').length
    const attendancePercent =
      totalAttendance === 0 ? 0 : Number(((presentCount / totalAttendance) * 100).toFixed(2))

    const { data: assessmentRows, error: assessmentError } = await serviceClient
      .from('assessments')
      .select('score,max_score')
      .eq('teacher_id', userId)
      .eq('student_id', studentId)
      .gte('assessment_date', monthStart)
      .lte('assessment_date', monthEnd)

    if (assessmentError) {
      return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
    }

    const testsDone = (assessmentRows ?? []).length
    const avgScore =
      testsDone === 0
        ? 0
        : Number(
            (
              (assessmentRows ?? []).reduce(
                (acc, row) => acc + (Number(row.score) / Number(row.max_score || 100)) * 100,
                0,
              ) / testsDone
            ).toFixed(2),
          )

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return errorResponse(
        'AI_PROVIDER_DOWN',
        'AI seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
        503,
      )
    }

    const prompt = buildReportPrompt({
      studentName: student.full_name as string,
      classLabel: student.class_label as string,
      subject: student.subject as string,
      month: monthStart,
      attendancePercent,
      avgScore,
      testsDone,
    })

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      },
    )

    if (geminiResponse.status === 429) {
      return errorResponse(
        'AI_RATE_LIMIT',
        'Abhi report generate nahi ho pa rahi, thodi der mein try karein.',
        429,
        parseRetryAfterSeconds(geminiResponse.headers.get('retry-after')),
      )
    }

    if (!geminiResponse.ok) {
      return errorResponse(
        'AI_PROVIDER_DOWN',
        'AI seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
        503,
      )
    }

    const geminiData = (await geminiResponse.json()) as GeminiResponse
    const reportText = (geminiData.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('\n')
      .trim()

    if (!reportText) {
      return errorResponse(
        'AI_PROVIDER_DOWN',
        'AI seva filhal uplabdh nahi hai. Neeche manual report bhej sakte hain.',
        503,
      )
    }

    const { data: insertData, error: insertError } = await serviceClient
      .from('progress_reports')
      .insert({
        teacher_id: userId,
        student_id: studentId,
        report_month: monthStart,
        attendance_percent: attendancePercent,
        avg_score: avgScore,
        tests_done: testsDone,
        language: body.language ?? 'hi',
        report_text: reportText,
        generated_by: 'gemini_2_0_flash',
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.message.includes('UPGRADE_REQUIRED')) {
        return errorResponse(
          'UPGRADE_REQUIRED',
          'Free plan me 1 AI report included hai. Pro plan le kar unlimited reports banayein.',
          402,
        )
      }
      return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
    }

    return jsonResponse({
      status: 'ok',
      report_id: insertData.id,
      report_text: reportText,
      attendance_percent: attendancePercent,
      avg_score: avgScore,
      tests_done: testsDone,
    })
  } catch {
    return errorResponse('NETWORK_ERROR', 'Internet connection weak hai. Connection check karke phir try karein.', 500)
  }
})
