/**
 * Hosts list endpoint
 * GET /api/v1/hosts
 *
 * Returns information about all configured ClickHouse hosts
 * Excludes sensitive information like passwords
 */

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { getClickHouseConfigs } from '@/lib/clickhouse'
import { debug, error, generateRequestId } from '@/lib/logger'
import { getHost } from '@/lib/utils'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/hosts', method: 'GET' }

/**
 * Host information for public API responses
 */
export interface HostInfo {
  readonly id: number
  readonly name: string
  readonly host: string
  readonly user: string
}

/**
 * Handle GET requests for hosts list
 */
export async function GET(): Promise<Response> {
  const requestId = generateRequestId()
  debug('[GET /api/v1/hosts] Fetching host configurations', { requestId })

  try {
    // Get all configured hosts
    const configs = getClickHouseConfigs()

    // Transform to public API format (exclude passwords)
    const hosts: HostInfo[] = configs.map((config) => ({
      id: config.id,
      name: config.customName || getHost(config.host) || `Host ${config.id}`,
      host: config.host,
      user: config.user,
    }))

    // Create response with standardized builder
    const response = createSuccessResponse(hosts, {
      queryId: 'hosts-list',
      rows: hosts.length,
    })

    // Add request ID header
    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Request-ID', requestId)
    newHeaders.set('Cache-Control', CacheControl.LONG)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[GET /api/v1/hosts] Error:', err, { requestId })

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

    // Add request ID header to error response
    const errorHeaders = new Headers(errorResponse.headers)
    errorHeaders.set('X-Request-ID', requestId)

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: errorHeaders,
    })
  }
}
