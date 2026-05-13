/**
 * Browser Connection Test endpoint
 * POST /api/v1/browser-connections/test
 *
 * Validates a browser-provided ClickHouse connection by running SELECT version().
 * Credentials are provided in the request body and never logged.
 */

import { createClient } from '@clickhouse/client-web'

import { createValidationError, withApiHandler } from '@/lib/api/error-handler'
import { validateHostUrl } from '@/lib/browser-connections/host-url'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = {
  route: '/api/v1/browser-connections/test',
  method: 'POST',
}

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

export const POST = withApiHandler(
  async (request: Request): Promise<Response> => {
    const body = (await request.json()) as Partial<TestConnectionRequest>

    const { host, user, password } = body

    if (!host || typeof host !== 'string') {
      return createValidationError(
        'Missing required field: host',
        ROUTE_CONTEXT
      )
    }
    if (!user || typeof user !== 'string') {
      return createValidationError(
        'Missing required field: user',
        ROUTE_CONTEXT
      )
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
  },
  ROUTE_CONTEXT
)
