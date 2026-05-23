/**
 * Edge Function: data-export
 *
 * Returns a JSON archive of every row in the cloud DB belonging to the
 * authenticated user, satisfying the Privacy Policy promise of right-to-access
 * under DPDP Act 2023.
 *
 * Wired client-side via:
 *   const { data } = await supabase.functions.invoke('data-export', { body: {} })
 *
 * The archive includes:
 *   - profile (1 row)
 *   - teacher_profile (1 row)
 *   - students, batches, batch_students
 *   - attendance_sessions, attendance_records
 *   - fee_records, assessments, progress_reports
 *   - parent_inquiries, parent_ratings, teacher_outcomes, profile_boosts
 *   - plan_payment_receipts
 *
 * The user can also export the local-only state from the More page.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ status: 'error', message }, status)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST' && request.method !== 'GET') {
    return errorResponse('Invalid request method.', 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return errorResponse('Server configuration missing.', 503)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return errorResponse('Unauthorized request.', 401)
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await authClient.auth.getUser()
  if (userError || !userData.user) {
    return errorResponse('Unauthorized request.', 401)
  }

  const userId = userData.user.id

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch all user-scoped data in parallel.
  const [
    profile,
    teacherProfile,
    students,
    batches,
    batchStudents,
    attendanceSessions,
    attendanceRecords,
    feeRecords,
    assessments,
    progressReports,
    teacherOutcomes,
    profileBoosts,
    receipts,
  ] = await Promise.all([
    adminClient.from('profiles').select('*').eq('id', userId).maybeSingle(),
    adminClient.from('teacher_profiles').select('*').eq('teacher_id', userId).maybeSingle(),
    adminClient.from('students').select('*').eq('teacher_id', userId),
    adminClient.from('batches').select('*').eq('teacher_id', userId),
    adminClient.from('batch_students').select('*').eq('teacher_id', userId),
    adminClient.from('attendance_sessions').select('*').eq('teacher_id', userId),
    adminClient.from('attendance_records').select('*').eq('teacher_id', userId),
    adminClient.from('fee_records').select('*').eq('teacher_id', userId),
    adminClient.from('assessments').select('*').eq('teacher_id', userId),
    adminClient.from('progress_reports').select('*').eq('teacher_id', userId),
    adminClient.from('teacher_outcomes').select('*').eq('teacher_id', userId),
    adminClient.from('profile_boosts').select('*').eq('teacher_id', userId),
    adminClient.from('plan_payment_receipts').select('id, provider, payment_id, cycle, amount_paise, currency, created_at').eq('teacher_id', userId),
  ])

  // Inquiries and ratings are scoped to teacher_profile_id, not teacher_id.
  let inquiries: unknown[] = []
  let ratings: unknown[] = []
  if (teacherProfile.data?.id) {
    const [inq, rat] = await Promise.all([
      adminClient.from('parent_inquiries').select('*').eq('teacher_profile_id', teacherProfile.data.id),
      adminClient.from('parent_ratings').select('*').eq('teacher_profile_id', teacherProfile.data.id),
    ])
    inquiries = inq.data ?? []
    ratings = rat.data ?? []
  }

  return jsonResponse({
    status: 'ok',
    exported_at: new Date().toISOString(),
    teacher_id: userId,
    data: {
      profile: profile.data ?? null,
      teacher_profile: teacherProfile.data ?? null,
      students: students.data ?? [],
      batches: batches.data ?? [],
      batch_students: batchStudents.data ?? [],
      attendance_sessions: attendanceSessions.data ?? [],
      attendance_records: attendanceRecords.data ?? [],
      fee_records: feeRecords.data ?? [],
      assessments: assessments.data ?? [],
      progress_reports: progressReports.data ?? [],
      teacher_outcomes: teacherOutcomes.data ?? [],
      profile_boosts: profileBoosts.data ?? [],
      plan_payment_receipts: receipts.data ?? [],
      parent_inquiries: inquiries,
      parent_ratings: ratings,
    },
  })
})
