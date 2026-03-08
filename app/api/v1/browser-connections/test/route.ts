/**
 * Browser Connection Test endpoint
 * POST /api/v1/browser-connections/test
 *
 * Validates a browser-provided ClickHouse connection by running SELECT version().
 * Credentials are provided in the request body and never logged.
 */

import { createClient } from '@clickhouse/client-web'

import { createValidationError, withApiHandler } from '@/lib/api/error-handler'

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
    const ssrfError = validateHostUrl(host)
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
