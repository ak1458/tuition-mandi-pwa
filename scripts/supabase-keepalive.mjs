#!/usr/bin/env node
/**
 * Supabase keep-alive ping.
 *
 * Free-tier Supabase projects pause after ~7 days of inactivity. This script
 * issues a few cheap, idempotent reads against the public REST API (PostgREST)
 * so the project is touched and the inactivity timer resets.
 *
 * Usage:
 *   node scripts/supabase-keepalive.mjs
 *
 * Env (set in CI / GitHub Action):
 *   SUPABASE_URL        e.g. https://iqcnhgwrxijxylcctlsg.supabase.co
 *   SUPABASE_ANON_KEY   the public anon key (NOT the service-role key)
 *
 * If env vars are missing, the script exits 0 (so cron does not flap) but
 * prints a clear warning that nothing was pinged.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

const TABLES_TO_TOUCH = [
  // Each is hit with `select=id&limit=1` — costs ~1 row read.
  'teacher_profiles',
  'students',
  'profiles',
]

const REQUEST_TIMEOUT_MS = 10_000

function log(level, message, extra) {
  const stamp = new Date().toISOString()
  const payload = extra ? ` ${JSON.stringify(extra)}` : ''
  console.log(`[${stamp}] [${level}] ${message}${payload}`)
}

async function pingTable(table) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  url.searchParams.set('select', 'id')
  url.searchParams.set('limit', '1')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      // 401/403 still counts as activity — the request hit the project.
      log('warn', `ping ${table} returned non-2xx`, { status: response.status })
      return { table, ok: false, status: response.status }
    }

    return { table, ok: true, status: response.status }
  } catch (error) {
    log('error', `ping ${table} failed`, { error: String(error) })
    return { table, ok: false, error: String(error) }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log(
      'warn',
      'SUPABASE_URL or SUPABASE_ANON_KEY missing. Nothing to ping. Exiting clean so CI does not flap.',
    )
    process.exit(0)
  }

  log('info', 'starting keep-alive ping', { project: SUPABASE_URL })

  const results = await Promise.all(TABLES_TO_TOUCH.map(pingTable))
  const successCount = results.filter((r) => r.ok).length
  const totalCount = results.length

  log('info', 'keep-alive ping complete', {
    success: successCount,
    total: totalCount,
    results,
  })

  // We only fail if every single ping failed — that suggests the project is
  // already paused or the keys are wrong. A single 401/404 is acceptable.
  if (successCount === 0) {
    log('error', 'all keep-alive pings failed; project may be paused')
    process.exit(1)
  }
}

main().catch((error) => {
  log('error', 'unexpected failure', { error: String(error) })
  process.exit(1)
})
