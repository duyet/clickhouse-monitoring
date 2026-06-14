/**
 * Health Webhook Proxy Endpoint
 * POST /api/v1/health/webhook
 *
 * Securely proxies Slack/Discord webhook requests from the server side to
 * bypass browser CORS preflight restrictions.
 *
 * Ported from apps/dashboard/app/api/v1/health/webhook/route.ts.
 * - Per-route auth (authorizeFeatureRequest / SETTINGS_FEATURE_PERMISSION)
 *   dropped; centralized in middleware (#1397).
 * - NextResponse replaced with standard Response / Response.json.
 * - @/lib/api/error-handler exists in this app and is imported directly.
 */

import { createFileRoute } from '@tanstack/react-router'

import { debug, error } from '@chm/logger'
import { createErrorResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'

const ROUTE_CONTEXT = {
  route: '/api/v1/health/webhook',
  method: 'POST',
} as const

async function handlePost(request: Request): Promise<Response> {
  debug('[POST /api/v1/health/webhook] Proxying alert webhook')

  let body: { url?: string; text?: string }
  try {
    body = (await request.json()) as { url?: string; text?: string }
  } catch {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Request body must be valid JSON',
      },
      400,
      ROUTE_CONTEXT
    )
  }

  const { url, text } = body

  if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Missing or invalid "url": expected an HTTPS webhook URL',
      },
      400,
      ROUTE_CONTEXT
    )
  }

  if (!text || typeof text !== 'string') {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Missing or invalid "text": expected a string payload',
      },
      400,
      ROUTE_CONTEXT
    )
  }

  debug(
    '[POST /api/v1/health/webhook] Proxying to:',
    `${url.substring(0, 40)}...`
  )

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      error(
        '[POST /api/v1/health/webhook] Remote webhook error:',
        new Error(`Status ${res.status}`),
        { errText }
      )
      return createErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: `Remote webhook returned status ${res.status}: ${errText}`,
        },
        res.status,
        ROUTE_CONTEXT
      )
    }

    return Response.json({ success: true }, { status: 200 })
  } catch (fetchErr: unknown) {
    clearTimeout(timeout)
    error('[POST /api/v1/health/webhook] Webhook fetch exception:', fetchErr)
    return createErrorResponse(
      {
        type: ApiErrorType.NetworkError,
        message: `Failed to connect to remote webhook: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
      },
      502,
      ROUTE_CONTEXT
    )
  }
}

export const Route = createFileRoute('/api/v1/health/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
