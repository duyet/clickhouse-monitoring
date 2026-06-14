/**
 * Browser Connection Test endpoint
 * POST /api/v1/browser-connections/test
 *
 * Validates a browser-provided ClickHouse connection by running SELECT version().
 * Credentials are provided in the request body and never logged.
 *
 * Ported from apps/dashboard/app/api/v1/browser-connections/test/route.ts.
 * - Per-route auth dropped; centralized in middleware (#1397).
 * - NextResponse replaced with standard Response / Response.json.
 */

import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@clickhouse/client-web'

import { createValidationError } from '@/lib/api/error-handler'
import {
  createHostValidationFetch,
  validateHostUrl,
} from '@/lib/browser-connections/host-url'

const ROUTE_CONTEXT = {
  route: '/api/v1/browser-connections/test',
  method: 'POST',
} as const

interface TestConnectionRequest {
  host: string
  user: string
  password: string
}

interface TestConnectionResponse {
  ok: boolean
  version?: string
  error?: string
}

async function handlePost(request: Request): Promise<Response> {
  let body: Partial<TestConnectionRequest>
  try {
    body = (await request.json()) as Partial<TestConnectionRequest>
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

  // Validate host URL and block SSRF targets
  const ssrfError = await validateHostUrl(host)
  if (ssrfError) {
    return createValidationError(ssrfError, ROUTE_CONTEXT)
  }

  try {
    const client = createClient({
      host,
      username: user,
      password,
      fetch: createHostValidationFetch(),
    })

    const result = await client.query({
      query: 'SELECT version() AS version',
      format: 'JSONEachRow',
    })

    const rows = (await result.json()) as { version: string }[]
    const version = rows[0]?.version

    const response: TestConnectionResponse = { ok: true, version }
    return Response.json(response, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    const response: TestConnectionResponse = { ok: false, error: message }
    return Response.json(response, { status: 200 })
  }
}

export const Route = createFileRoute('/api/v1/browser-connections/test')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
