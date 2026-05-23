/**
 * Edge Function: account-deletion
 *
 * Authenticated, idempotent deletion of a teacher account and ALL associated
 * cloud data, satisfying the Privacy Policy promise of full erasure under
 * DPDP Act 2023 (right to erasure).
 *
 * Flow:
 *   1. Caller passes their JWT in Authorization header.
 *   2. We verify the user via the anon client.
 *   3. We delete the corresponding auth.users row using the service-role
 *      admin API. ON DELETE CASCADE on profiles, teacher_profiles,
 *      students, attendance_*, fee_records, assessments, progress_reports,
 *      batches, batch_students, plan_payment_receipts wipes all their data.
 *      teacher_outcomes / profile_boosts / parent_inquiries / parent_ratings
 *      cascade through teacher_profiles.
 *   4. Return 200 with status ok.
 *
 * Wired client-side via:
 *   await supabase.functions.invoke('account-deletion', { body: {} })
 *
 * IMPORTANT: this is irreversible. The client MUST require explicit user
 * confirmation before invoking.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
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

  if (request.method !== 'POST') {
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

  // Defensive explicit deletes — cascades cover most of these but doing them
  // explicitly first means we get clear errors if a constraint blocks
  // deletion. All scoped to the caller's id only.
  const tables = [
    'progress_reports',
    'assessments',
    'attendance_records',
    'attendance_sessions',
    'fee_records',
    'batch_students',
    'students',
    'batches',
    'plan_payment_receipts',
    'profile_boosts',
    'teacher_outcomes',
  ] as const

  for (const table of tables) {
    const { error } = await adminClient.from(table).delete().eq('teacher_id', userId)
    if (error) {
      console.warn(`[account-deletion] failed to delete from ${table}:`, error.message)
      // continue — some tables may not have rows
    }
  }

  // teacher_profiles is keyed on teacher_id (unique). Inquiries / ratings
  // cascade from this row.
  const { error: tpErr } = await adminClient.from('teacher_profiles').delete().eq('teacher_id', userId)
  if (tpErr) {
    console.warn('[account-deletion] failed to delete teacher_profiles:', tpErr.message)
  }

  // profiles row uses id = auth.users.id.
  const { error: profErr } = await adminClient.from('profiles').delete().eq('id', userId)
  if (profErr) {
    console.warn('[account-deletion] failed to delete profiles:', profErr.message)
  }

  // Finally, delete the auth.users row. This is the irreversible step.
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteUserError) {
    return errorResponse(`Account deletion failed: ${deleteUserError.message}`, 500)
  }

  return jsonResponse({ status: 'ok' })
})
