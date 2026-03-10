export type ReportErrorCode =
  | 'AI_RATE_LIMIT'
  | 'AI_PROVIDER_DOWN'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UPGRADE_REQUIRED'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function errorResponse(
  code: ReportErrorCode,
  message: string,
  status = 400,
  retryAfterSeconds = 0,
): Response {
  return jsonResponse(
    {
      status: 'error',
      error_code: code,
      user_message_hi: message,
      retry_after_seconds: retryAfterSeconds,
    },
    status,
  )
}
