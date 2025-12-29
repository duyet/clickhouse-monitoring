/**
 * Hosts list endpoint
 * GET /api/v1/hosts
 *
 * Returns information about all configured ClickHouse hosts
 * Excludes sensitive information like passwords
 */

import { getClickHouseConfigs } from '@/lib/clickhouse'
import type { ApiResponse } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import {
  createErrorResponse as createApiErrorResponse,
} from '@/lib/api/error-handler'
import { debug, error } from '@/lib/logger'

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
  debug('[GET /api/v1/hosts] Fetching host configurations')

  try {
    // Get all configured hosts
    const configs = getClickHouseConfigs()

    // Transform to public API format (exclude passwords)
    const hosts: HostInfo[] = configs.map((config) => ({
      id: config.id,
      name: config.customName || `Host ${config.id}`,
      host: config.host,
      user: config.user,
    }))

    // Create response
    const response: ApiResponse<HostInfo[]> = {
      success: true,
      data: hosts,
      metadata: {
        queryId: 'hosts-list',
        duration: 0,
        rows: hosts.length,
        host: 'system',
      },
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[GET /api/v1/hosts] Error:', errorMessage)

    return createApiErrorResponse(
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
  }
}
