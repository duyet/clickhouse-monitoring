/**
 * Browser Connection Proxy endpoint
 * POST /api/v1/browser-connections/proxy
 *
 * Executes a ClickHouse query using browser-provided connection credentials.
 * Returns results in the same shape as /api/v1/data.
 * Credentials are provided in the request body and never logged.
 */

import type { DataFormat } from '@clickhouse/client'
import { createClient } from '@clickhouse/client-web'

import { createValidationError, withApiHandler } from '@/lib/api/error-handler'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { validateHostUrl } from '@/lib/browser-connections/host-url'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = {
  route: '/api/v1/browser-connections/proxy',
  method: 'POST',
}

interface ProxyConnection {
  host: string
  user: string
  password: string
}

interface ProxyRequest {
  connection: ProxyConnection
  query: string
  query_params?: Record<string, string | number | boolean>
  format?: string
}

export const POST = withApiHandler(
  async (request: Request): Promise<Response> => {
    const body = (await request.json()) as Partial<ProxyRequest>

    const { connection, query, query_params, format = 'JSONEachRow' } = body

    if (!connection || typeof connection !== 'object') {
      return createValidationError(
        'Missing required field: connection',
        ROUTE_CONTEXT
      )
    }

    const { host, user, password } = connection

    if (!host || typeof host !== 'string') {
      return createValidationError(
        'Missing required field: connection.host',
        ROUTE_CONTEXT
      )
    }
    if (!user || typeof user !== 'string') {
      return createValidationError(
        'Missing required field: connection.user',
        ROUTE_CONTEXT
      )
    }
    if (typeof password !== 'string') {
      return createValidationError(
        'Missing required field: connection.password',
        ROUTE_CONTEXT
      )
    }
    if (!query || typeof query !== 'string') {
      return createValidationError(
        'Missing required field: query',
        ROUTE_CONTEXT
      )
    }

    // Validate host URL and block SSRF targets
    const ssrfError = await validateHostUrl(host)
    if (ssrfError) {
      return createValidationError(ssrfError, ROUTE_CONTEXT)
    }

    const start = Date.now()

    try {
      const client = createClient({
        host,
        username: user,
        password,
      })

      const result = await client.query({
        query,
        query_params,
        format: format as DataFormat,
      })

      const rows = await result.json<unknown[]>()
      const duration = Date.now() - start
      const rowCount = Array.isArray(rows) ? rows.length : 0

      return createSuccessResponse(rows, {
        duration,
        rows: rowCount,
        queryId: result.query_id,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Query execution failed'
      return createErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message,
          details: { timestamp: new Date().toISOString() },
        },
        500,
        ROUTE_CONTEXT
      )
    }
  },
  ROUTE_CONTEXT
)
