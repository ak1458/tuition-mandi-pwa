import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

type BillingCycle = 'monthly' | 'yearly'

interface UpgradePlanRequest {
  cycle?: unknown
  payment_id?: unknown
}

interface RazorpayPayment {
  id?: string
  status?: string
  amount?: number
  currency?: string
  captured?: boolean | number
  notes?: {
    teacher_id?: string
  }
}

const BILLING_PRICES: Record<BillingCycle, number> = {
  monthly: 19900,
  yearly: 149900,
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 5

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse(
    {
      status: 'error',
      message,
    },
    status,
  )
}

function parseCycle(value: unknown): BillingCycle | null {
  if (value === 'monthly' || value === 'yearly') {
    return value
  }
  return null
}

function fallbackTeacherName(user: {
  email?: string
  phone?: string | null
  user_metadata?: Record<string, unknown> | null
}): string {
  const metadataName = user.user_metadata?.full_name
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim()
  }

  if (user.email?.includes('@')) {
    return user.email.split('@')[0]
  }

  if (user.phone) {
    const digits = user.phone.replace(/\D/g, '')
    const suffix = digits.slice(-4)
    if (suffix) return `Teacher ${suffix}`
  }

  return 'Teacher'
}

function buildNextExpiry(cycle: BillingCycle, currentPlan: string | null | undefined, currentExpiry: string | null): string {
  const now = new Date()
  const expiryDate = currentExpiry ? new Date(currentExpiry) : null
  const hasActivePro =
    currentPlan === 'pro' &&
    Boolean(expiryDate) &&
    !Number.isNaN(expiryDate!.getTime()) &&
    expiryDate!.getTime() > now.getTime()

  const base = hasActivePro ? new Date(expiryDate as Date) : now
  if (cycle === 'yearly') {
    base.setFullYear(base.getFullYear() + 1)
  } else {
    base.setMonth(base.getMonth() + 1)
  }

  return base.toISOString()
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
  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return errorResponse('Server configuration missing.', 503)
  }

  if (!razorpayKeyId || !razorpayKeySecret) {
    return errorResponse('Payment gateway is not configured.', 503)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return errorResponse('Unauthorized request.', 401)
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

  let body: UpgradePlanRequest
  try {
    body = (await request.json()) as UpgradePlanRequest
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const cycle = parseCycle(body.cycle)
  const paymentId = typeof body.payment_id === 'string' ? body.payment_id.trim() : ''

  if (!cycle || !paymentId) {
    return errorResponse('Billing cycle and payment id are required.', 400)
  }

  const { data: userData, error: userError } = await authClient.auth.getUser()
  if (userError || !userData.user) {
    return errorResponse('Unauthorized request.', 401)
  }

  const user = userData.user
  const teacherId = user.id

  // Rate limit: max 5 upgrade attempts per hour per user.
  // Fail-closed: if the rate-limit query itself fails, deny the request.
  const { count: recentCount, error: rlError } = await serviceClient
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action_type', 'upgrade_plan')
    .eq('fingerprint', teacherId)
    .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())

  if (rlError) {
    // Rate-limit infrastructure is unavailable; refuse rather than fail open.
    console.error('[upgrade-plan] rate_limit_log query failed:', rlError.message)
    return errorResponse('Service temporarily unavailable. Try again shortly.', 503)
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    return errorResponse('Too many upgrade attempts. Please try again later.', 429)
  }

  // ---- Validate the Razorpay payment BEFORE counting this against the limit ----
  const basicCredentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
  const paymentVerifyResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicCredentials}`,
    },
  })

  if (!paymentVerifyResponse.ok) {
    return errorResponse('Payment verification failed. Please contact support.', 402)
  }

  const payment = (await paymentVerifyResponse.json()) as RazorpayPayment
  const paymentAmount = Number(payment.amount)
  const paymentCurrency = String(payment.currency ?? '').toUpperCase()
  const paymentStatus = String(payment.status ?? '').toLowerCase()
  const paymentTeacherId = typeof payment.notes?.teacher_id === 'string' ? payment.notes.teacher_id : ''
  const isCaptured = paymentStatus === 'captured' || payment.captured === true || Number(payment.captured) === 1

  if (!isCaptured) {
    return errorResponse('Payment is not captured yet.', 402)
  }

  if (paymentCurrency !== 'INR') {
    return errorResponse('Invalid payment currency.', 402)
  }

  if (paymentAmount !== BILLING_PRICES[cycle]) {
    return errorResponse('Invalid payment amount for selected plan.', 402)
  }

  if (paymentTeacherId && paymentTeacherId !== teacherId) {
    return errorResponse('Payment does not belong to this account.', 402)
  }

  // Log this request for rate limiting AFTER validation succeeded — so users
  // do not burn through their budget on garbage / failed-network attempts.
  await serviceClient.from('rate_limit_log').insert({
    action_type: 'upgrade_plan',
    fingerprint: teacherId,
  })

  const { error: receiptError } = await serviceClient.from('plan_payment_receipts').insert({
    teacher_id: teacherId,
    provider: 'razorpay',
    payment_id: paymentId,
    cycle,
    amount_paise: paymentAmount,
    currency: paymentCurrency,
    raw_payload: payment,
  })

  if (receiptError) {
    if (receiptError.code === '23505') {
      return errorResponse('This payment was already used for an upgrade.', 409)
    }
    return errorResponse('Could not record payment receipt.', 500)
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('full_name, plan, plan_expires_at')
    .eq('id', teacherId)
    .maybeSingle()

  if (profileError) {
    return errorResponse('Could not load profile.', 500)
  }

  const nextExpiry = buildNextExpiry(cycle, profile?.plan, profile?.plan_expires_at ?? null)

  const { error: upsertError } = await serviceClient.from('profiles').upsert(
    {
      id: teacherId,
      full_name: profile?.full_name || fallbackTeacherName(user),
      phone_e164: user.phone ?? null,
      email: user.email ?? null,
      plan: 'pro',
      plan_expires_at: nextExpiry,
    },
    { onConflict: 'id' },
  )

  if (upsertError) {
    return errorResponse('Could not activate Pro plan.', 500)
  }

  return jsonResponse({
    status: 'ok',
    plan: 'pro',
    plan_expires_at: nextExpiry,
  })
})
