/**
 * Host Connection Test endpoint
 * POST /api/v1/hosts/test
 *
 * Tests connection to a ClickHouse instance using provided credentials
 * Returns success status and ClickHouse version if successful
 *
 * Security:
 * - Requires authentication (when auth is enabled)
 * - SSRF protection: blocks internal IP ranges
 */

import { createClient as createClientWeb } from '@clickhouse/client-web'

import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'
import { type AuthContext, withAuth } from '@/lib/auth/middleware'
import { debug, error, generateRequestId } from '@/lib/logger'

/**
 * SSRF protection: validate host URL to prevent internal network access
 * Blocks private IP ranges and localhost
 */
function isInternalHost(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const hostname = url.hostname.toLowerCase()

    // Block localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return true
    }

    // Block private IP ranges (RFC 1918)
    const ipParts = hostname.split('.')
    if (ipParts.length === 4) {
      const [a, b] = ipParts.map(Number)
      // 10.0.0.0/8
      if (a === 10) return true
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true
      // 192.168.0.0/16
      if (a === 192 && b === 168) return true
      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return true
    }

    // Block metadata endpoints (cloud provider internal APIs)
    if (
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return true
    }

    return false
  } catch {
    // Invalid URL
    return true
  }
}

/**
 * Validate URL scheme (only allow http/https)
 */
function isValidScheme(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

/**
 * Request body for testing a connection
 */
interface TestConnectionRequest {
  host: string
  username: string
  password: string
}

/**
 * Handle POST requests to test connection
 * Protected by authentication when auth is enabled
 */
async function handleTestConnection(
  request: NextRequest,
  _context: { params: Promise<Record<string, unknown>> },
  _authContext: AuthContext
): Promise<NextResponse> {
  const requestId = generateRequestId()
  debug('[POST /api/v1/hosts/test] Testing connection', { requestId })

  try {
    // Parse request body
    const body = (await request.json()) as TestConnectionRequest

    // Validate required fields
    if (!body.host || !body.username || !body.password) {
      return NextResponse.json(
        {
          error: {
            type: 'ValidationError',
            message: 'Missing required fields',
            details: { required: ['host', 'username', 'password'] },
          },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      )
    }

    // SSRF protection: validate URL scheme
    if (!isValidScheme(body.host)) {
      return NextResponse.json(
        {
          error: {
            type: 'ValidationError',
            message:
              'Invalid host URL scheme. Only http:// and https:// are allowed.',
            details: { host: body.host },
          },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      )
    }

    // SSRF protection: block internal/private networks
    if (isInternalHost(body.host)) {
      return NextResponse.json(
        {
          error: {
            type: 'ValidationError',
            message:
              'Connection to internal or private networks is not allowed for security reasons.',
            details: { host: body.host },
          },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      )
    }

    // Create a temporary client (use web client for universal compatibility)
    const client = createClientWeb({
      host: body.host,
      username: body.username,
      password: body.password,
      clickhouse_settings: {
        max_execution_time: 10, // Short timeout for connection test
      },
    })

    try {
      // Test the connection by getting the version
      const result = await client.query({
        query: 'SELECT version() AS version',
        format: 'JSONEachRow',
      })

      const rows = await result.json<{ version: string }[]>()
      const version = rows[0]?.version || 'Unknown'

      debug('[POST /api/v1/hosts/test] Connection successful', {
        requestId,
        version,
      })

      // Close the temporary client
      await client.close()

      // Return success response
      return NextResponse.json(
        {
          data: {
            success: true,
            version,
            message: 'Connection successful',
          },
          meta: {
            queryId: 'host-connection-test',
            rows: 1,
          },
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      )
    } catch (connectionError) {
      // Close the client even on error
      try {
        await client.close()
      } catch {
        // Ignore close errors
      }

      const errorMessage =
        connectionError instanceof Error
          ? connectionError.message
          : 'Connection failed'

      debug('[POST /api/v1/hosts/test] Connection failed', {
        requestId,
        error: errorMessage,
      })

      return NextResponse.json(
        {
          error: {
            type: 'NetworkError',
            message: 'Connection test failed',
            details: { error: errorMessage },
          },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      )
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[POST /api/v1/hosts/test] Error:', err, { requestId })

    return NextResponse.json(
      {
        error: {
          type: 'QueryError',
          message: errorMessage,
          details: { timestamp: new Date().toISOString() },
        },
      },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    )
  }
}

/**
 * Export POST handler with authentication
 * Requires user to be authenticated to test connections
 */
export const POST = withAuth(handleTestConnection, {
  required: true,
})
