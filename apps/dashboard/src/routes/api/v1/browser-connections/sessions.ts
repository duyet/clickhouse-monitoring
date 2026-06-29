/**
 * Browser connection session tokens.
 * POST /api/v1/browser-connections/sessions
 */

import { createFileRoute } from '@tanstack/react-router'

import { createValidationError } from '@/lib/api/error-handler'
import { validateHostUrl } from '@/lib/browser-connections/host-url'
import { queryConnection } from '@/lib/connection-query/connection-client'
import { toSessionPayload } from '@/lib/connection-query/resolve-credentials'
import { createConnectionSession } from '@/lib/connection-sessions/store'
import {
  connectionFingerprint,
  SESSION_TTL_MS,
} from '@/lib/connection-sessions/types'
import { isEncryptionConfigured } from '@/lib/connection-store/crypto'

const ROUTE_CONTEXT = {
  route: '/api/v1/browser-connections/sessions',
  method: 'POST',
} as const

interface SessionRequest {
  host: string
  user: string
  password: string
}

async function handlePost(request: Request): Promise<Response> {
  if (!isEncryptionConfigured()) {
    return Response.json(
      {
        success: false,
        error: {
          type: 'configuration',
          message:
            'CHM_USER_CONNECTIONS_ENCRYPTION_KEY must be configured for connection sessions',
        },
      },
      { status: 503 }
    )
  }

  let body: Partial<SessionRequest>
  try {
    body = (await request.json()) as Partial<SessionRequest>
  } catch {
    return createValidationError(
      'Request body must be valid JSON',
      ROUTE_CONTEXT
    )
  }

  const { host, user, password } = body
  if (!host || typeof host !== 'string') {
    return createValidationError('Missing required field: host', ROUTE_CONTEXT)
  }
  if (!user || typeof user !== 'string') {
    return createValidationError('Missing required field: user', ROUTE_CONTEXT)
  }
  if (typeof password !== 'string') {
    return createValidationError(
      'Missing required field: password',
      ROUTE_CONTEXT
    )
  }

  const ssrfError = await validateHostUrl(host)
  if (ssrfError) {
    return createValidationError(ssrfError, ROUTE_CONTEXT)
  }

  const credentials = { host, user, password }

  try {
    await queryConnection(credentials, 'SELECT 1')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return Response.json(
      { success: false, error: { message } },
      { status: 400 }
    )
  }

  const payload = toSessionPayload(credentials)
  const session = await createConnectionSession(payload, null)

  return Response.json({
    success: true,
    data: {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      ttlMs: SESSION_TTL_MS,
      fingerprint: connectionFingerprint(credentials),
    },
  })
}

export const Route = createFileRoute('/api/v1/browser-connections/sessions')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
