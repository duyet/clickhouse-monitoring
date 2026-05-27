/**
 * Health Webhook Proxy Endpoint
 * POST /api/v1/health/webhook
 *
 * Securely proxies Slack/Discord webhook requests from the server side to bypass browser CORS preflight restrictions.
 */

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { SETTINGS_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/health/webhook', method: 'POST' }

export async function POST(request: Request): Promise<Response> {
  debug('[POST /api/v1/health/webhook] Proxying alert webhook')

  try {
    // Ensure user has settings access permissions before proxying
    const permissionResponse = await authorizeFeatureRequest(
      SETTINGS_FEATURE_PERMISSION,
      request
    )
    if (permissionResponse) return permissionResponse

    const body = (await request.json()) as {
      url?: string
      text?: string
    }

    const { url, text } = body

    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return createApiErrorResponse(
        {
          type: 'validation_error' as any,
          message: 'Missing or invalid "url": expected an HTTPS webhook URL',
        },
        400,
        ROUTE_CONTEXT
      )
    }

    if (!text || typeof text !== 'string') {
      return createApiErrorResponse(
        {
          type: 'validation_error' as any,
          message: 'Missing or invalid "text": expected a string payload',
        },
        400,
        ROUTE_CONTEXT
      )
    }

    debug(
      '[POST /api/v1/health/webhook] Proxying to:',
      url.substring(0, 40) + '...'
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
        return createApiErrorResponse(
          {
            type: 'query_error' as any,
            message: `Remote webhook returned status ${res.status}: ${errText}`,
          },
          res.status,
          ROUTE_CONTEXT
        )
      }

      return Response.json({ success: true }, { status: 200 })
    } catch (fetchErr: any) {
      clearTimeout(timeout)
      error('[POST /api/v1/health/webhook] Webhook fetch exception:', fetchErr)
      return createApiErrorResponse(
        {
          type: 'network_error' as any,
          message: `Failed to connect to remote webhook: ${fetchErr.message || fetchErr}`,
        },
        502,
        ROUTE_CONTEXT
      )
    }
  } catch (err: any) {
    error('[POST /api/v1/health/webhook] Request failed:', err)
    return createApiErrorResponse(
      {
        type: 'internal_error' as any,
        message: err.message || 'Internal server error',
      },
      500,
      ROUTE_CONTEXT
    )
  }
}
