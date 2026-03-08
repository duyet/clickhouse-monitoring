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

export const dynamic = 'force-dynamic'

/**
 * Returns an error string if the host URL is invalid or targets a private/internal address.
 * Returns null when the host is safe to use.
 */
function validateHostUrl(host: string): string | null {
  let url: URL
  try {
    url = new URL(host)
  } catch {
    return `Invalid host URL: "${host}". Must be a full URL (e.g., https://my.clickhouse.cloud:8443)`
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `Unsupported protocol "${url.protocol}". Only http and https are allowed.`
  }

  const hostname = url.hostname.toLowerCase()

  // Block IPv6 loopback
  if (hostname === '[::1]' || hostname === '::1') {
    return 'Connections to internal addresses are not allowed.'
  }

  // Block hostnames that resolve to loopback / link-local
  if (hostname === 'localhost') {
    return 'Connections to internal addresses are not allowed.'
  }

  // Block private IPv4 ranges via octet parsing
  const ipv4Match = hostname.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  )
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    const isPrivate =
      a === 127 || // 127.0.0.0/8 loopback
      a === 10 || // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 169 && b === 254) // 169.254.0.0/16 link-local

    if (isPrivate) {
      return 'Connections to internal addresses are not allowed.'
    }
  }

  // Block fc00::/7 ULA IPv6 range (fc and fd prefixes)
  const ipv6 = hostname.replace(/^\[|\]$/g, '')
  if (/^f[cd]/i.test(ipv6)) {
    return 'Connections to internal addresses are not allowed.'
  }

  return null
}

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
    const ssrfError = validateHostUrl(host)
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
