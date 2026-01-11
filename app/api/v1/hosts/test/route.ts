/**
 * Host Connection Test endpoint
 * POST /api/v1/hosts/test
 *
 * Tests connection to a ClickHouse instance using provided credentials
 * Returns success status and ClickHouse version if successful
 */

import { createClient as createClientWeb } from '@clickhouse/client-web'

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { debug, error, generateRequestId } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/hosts/test', method: 'POST' }

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
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[POST /api/v1/hosts/test] Testing connection', { requestId })

  try {
    // Parse request body
    const body = (await request.json()) as TestConnectionRequest

    // Validate required fields
    if (!body.host || !body.username || !body.password) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required fields',
          details: {
            required: ['host', 'username', 'password'],
          },
        },
        400,
        ROUTE_CONTEXT
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
      const response = createSuccessResponse(
        {
          success: true,
          version,
          message: 'Connection successful',
        },
        {
          queryId: 'host-connection-test',
          rows: 1,
        }
      )

      const newHeaders = new Headers(response.headers)
      newHeaders.set('X-Request-ID', requestId)

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
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

      return createApiErrorResponse(
        {
          type: ApiErrorType.NetworkError,
          message: 'Connection test failed',
          details: {
            error: errorMessage,
          },
        },
        400,
        ROUTE_CONTEXT
      )
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[POST /api/v1/hosts/test] Error:', err, { requestId })

    const errorResponse = createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT
    )

    const errorHeaders = new Headers(errorResponse.headers)
    errorHeaders.set('X-Request-ID', requestId)

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: errorHeaders,
    })
  }
}
