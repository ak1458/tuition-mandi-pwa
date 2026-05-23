/**
 * Razorpay webhook handler.
 *
 * Razorpay POSTs server-to-server when a payment completes. Even if the user
 * closes the browser before our `upgrade-plan` callback fires, the webhook
 * arrives and upgrades the plan. So this is a defensive "always-runs" path.
 *
 * Wire-up (one time, in Razorpay dashboard):
 *   URL: https://YOUR_PROJECT_REF.functions.supabase.co/razorpay-webhook
 *   Active events: payment.captured
 *   Secret: pick a strong random value, paste into Supabase secrets as
 *           RAZORPAY_WEBHOOK_SECRET.
 *
 * This function does NOT require the user's auth header (Razorpay doesn't have
 * one). Authenticity is established by HMAC-SHA256 of the raw body using the
 * webhook secret.
 *
 * Replay protection:
 *   - HMAC signature verification (always)
 *   - Idempotency on payment_id via plan_payment_receipts.payment_id UNIQUE
 *   - Reject events whose `created_at` (epoch seconds) is older than
 *     REPLAY_WINDOW_SECONDS, so a leaked secret can't replay a 6-month-old
 *     event with stale pricing.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

type BillingCycle = 'monthly' | 'yearly'

const BILLING_PRICES: Record<BillingCycle, number> = {
  monthly: 19900,
  yearly: 149900,
}

// Razorpay's documented webhook delivery window is at most a few hours
// (with retries up to 24h). Reject anything claiming to be older than
// 48 hours — that's our replay window.
const REPLAY_WINDOW_SECONDS = 48 * 60 * 60

function inferCycleFromAmount(amountPaise: number): BillingCycle | null {
  if (amountPaise === BILLING_PRICES.monthly) return 'monthly'
  if (amountPaise === BILLING_PRICES.yearly) return 'yearly'
  return null
}

function buildNextExpiry(
  cycle: BillingCycle,
  currentPlan: string | null | undefined,
  currentExpiry: string | null,
): string {
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

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare.
  if (computed.length !== signature.length) return false
  let result = 0
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

  if (!supabaseUrl || !serviceKey || !webhookSecret) {
    // Misconfigured server - never echo details to caller.
    return new Response('Server not configured', { status: 503 })
  }

  const signature = request.headers.get('x-razorpay-signature') ?? ''
  if (!signature) {
    return new Response('Missing signature', { status: 401 })
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return new Response('Bad body', { status: 400 })
  }

  const isValid = await verifySignature(rawBody, signature, webhookSecret)
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: {
    event?: string
    created_at?: number
    payload?: {
      payment?: {
        entity?: {
          id?: string
          amount?: number
          currency?: string
          status?: string
          captured?: boolean
          created_at?: number
          notes?: { teacher_id?: string }
        }
      }
    }
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  // ---- Replay-window check ----
  // Razorpay sends `created_at` as Unix seconds at the event level, and again
  // on the payment entity. Use the most recent of the two if both are present.
  const eventCreatedAt = Number(payload.created_at ?? 0)
  const paymentCreatedAt = Number(payload.payload?.payment?.entity?.created_at ?? 0)
  const effectiveCreatedAt = Math.max(eventCreatedAt, paymentCreatedAt)
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (effectiveCreatedAt > 0) {
    const ageSeconds = nowSeconds - effectiveCreatedAt
    if (ageSeconds > REPLAY_WINDOW_SECONDS) {
      // Older than our replay window — reject without modifying state.
      // 200 so Razorpay stops retrying.
      console.warn('[razorpay-webhook] rejecting stale event', { ageSeconds, eventCreatedAt, paymentCreatedAt })
      return new Response('Stale event ignored', { status: 200 })
    }
    // Tiny clock-skew tolerance for "future" timestamps: allow up to 5 min.
    if (ageSeconds < -300) {
      console.warn('[razorpay-webhook] rejecting future-dated event', { ageSeconds })
      return new Response('Invalid event timestamp', { status: 400 })
    }
  }

  // We only act on payment.captured. Acknowledge everything else to avoid
  // Razorpay retrying.
  if (payload.event !== 'payment.captured') {
    return new Response('Ignored', { status: 200 })
  }

  const payment = payload.payload?.payment?.entity
  const paymentId = payment?.id
  const amountPaise = Number(payment?.amount ?? 0)
  const currency = String(payment?.currency ?? '').toUpperCase()
  const teacherId = payment?.notes?.teacher_id

  if (!paymentId || !teacherId || currency !== 'INR') {
    // Unverifiable - 200 so Razorpay stops retrying; we just don't act.
    return new Response('Ignored - missing fields', { status: 200 })
  }

  // Validate teacher_id is a UUID before using it in DB queries.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId)) {
    return new Response('Ignored - invalid teacher_id', { status: 200 })
  }

  const cycle = inferCycleFromAmount(amountPaise)
  if (!cycle) {
    return new Response('Ignored - amount mismatch', { status: 200 })
  }

  const serviceClient = createClient(supabaseUrl, serviceKey)

  // Idempotency: receipts table has a unique index on payment_id.
  const { error: receiptError } = await serviceClient.from('plan_payment_receipts').insert({
    teacher_id: teacherId,
    provider: 'razorpay',
    payment_id: paymentId,
    cycle,
    amount_paise: amountPaise,
    currency,
    raw_payload: payment,
  })

  if (receiptError) {
    if (receiptError.code === '23505') {
      // Already processed by upgrade-plan or a previous webhook delivery. Done.
      return new Response('Already applied', { status: 200 })
    }
    // Real server error - return 500 so Razorpay retries.
    return new Response('Receipt insert failed', { status: 500 })
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('full_name, plan, plan_expires_at, phone_e164, email')
    .eq('id', teacherId)
    .maybeSingle()

  if (profileError) {
    return new Response('Profile read failed', { status: 500 })
  }

  const nextExpiry = buildNextExpiry(cycle, profile?.plan, profile?.plan_expires_at ?? null)

  const { error: upsertError } = await serviceClient.from('profiles').upsert(
    {
      id: teacherId,
      full_name: profile?.full_name ?? 'Teacher',
      phone_e164: profile?.phone_e164 ?? null,
      email: profile?.email ?? null,
      plan: 'pro',
      plan_expires_at: nextExpiry,
    },
    { onConflict: 'id' },
  )

  if (upsertError) {
    return new Response('Plan upsert failed', { status: 500 })
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
