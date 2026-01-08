/**
 * Notifications API endpoint
 * GET /api/v1/notifications
 *
 * Returns a list of active notifications/alerts across all clusters.
 * Currently supports readonly tables warnings.
 *
 * Required parameters:
 * - hostId (query): Host to execute the query on
 */

import { createErrorResponse } from '@/lib/api/error-handler'
import { HostIdSchema } from '@/lib/api/schemas'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error, generateRequestId } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/notifications', method: 'GET' }

export interface Notification {
  readonly type: 'readonly-tables'
  readonly cluster: string
  readonly count: number
  readonly severity: 'critical' | 'warning'
}

interface NotificationsResponse {
  readonly notifications: readonly Notification[]
  readonly totalCount: number
}

export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()

  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Validate hostId parameter
    const hostIdResult = HostIdSchema.safeParse(
      searchParams.get('hostId') ?? '0'
    )
    if (!hostIdResult.success) {
      error('[GET /api/v1/notifications] Invalid hostId parameter', undefined, {
        requestId,
      })
      const errorResponse = createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invalid hostId parameter: must be a non-negative integer',
        },
        400,
        ROUTE_CONTEXT
      )
      const headers = new Headers(errorResponse.headers)
      headers.set('X-Request-ID', requestId)
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers,
      })
    }

    const hostId = hostIdResult.data

    debug('[GET /api/v1/notifications] Fetching notifications', {
      requestId,
      hostId,
    })

    // Step 1: Get all clusters
    const clustersResult = await fetchData({
      query: `
        SELECT DISTINCT cluster
        FROM system.clusters
        ORDER BY cluster ASC
      `,
      format: 'JSONEachRow',
      hostId,
    })

    if (clustersResult.error) {
      error('[GET /api/v1/notifications] Failed to fetch clusters', undefined, {
        requestId,
        error: clustersResult.error.message,
      })
      const errorResponse = createErrorResponse(
        {
          type: clustersResult.error.type as ApiErrorType,
          message: 'Failed to fetch clusters',
        },
        500,
        { ...ROUTE_CONTEXT, hostId }
      )
      const headers = new Headers(errorResponse.headers)
      headers.set('X-Request-ID', requestId)
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers,
      })
    }

    const clusters = clustersResult.data as Array<{ cluster: string }>

    // Step 2: For each cluster, check readonly tables count
    const notifications: Notification[] = []

    for (const { cluster } of clusters) {
      const readonlyResult = await fetchData({
        query: `
          SELECT COUNT() as count
          FROM clusterAllReplicas({cluster: String}, system.replicas)
          WHERE is_readonly = 1
        `,
        format: 'JSONEachRow',
        hostId,
        query_params: { cluster },
      })

      // Skip if query fails (cluster might not support this query)
      if (readonlyResult.error) {
        debug('[GET /api/v1/notifications] Skipping cluster due to error', {
          requestId,
          cluster,
          error: readonlyResult.error.message,
        })
        continue
      }

      const readonlyData = readonlyResult.data as Array<{
        count?: number | string
      }>
      const readonlyCount =
        readonlyData.length > 0 && readonlyData[0].count !== undefined
          ? Number(readonlyData[0].count)
          : 0

      // Only add notification if there are readonly tables
      if (readonlyCount > 0) {
        notifications.push({
          type: 'readonly-tables',
          cluster,
          count: readonlyCount,
          severity: readonlyCount > 10 ? 'critical' : 'warning',
        })
      }
    }

    const totalCount = notifications.length

    debug('[GET /api/v1/notifications] Notifications result', {
      requestId,
      hostId,
      totalCount,
      notifications: notifications.map((n) => ({
        cluster: n.cluster,
        type: n.type,
        count: n.count,
      })),
    })

    const response = createSuccessResponse<NotificationsResponse>(
      { notifications, totalCount },
      { queryId: 'notifications', rows: totalCount }
    )
    const headers = new Headers(response.headers)
    headers.set('X-Request-ID', requestId)
    // Use short cache for notifications (30 seconds)
    headers.set('Cache-Control', CacheControl.SHORT)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (err) {
    error('[GET /api/v1/notifications] Unexpected error:', err, { requestId })
    const errorResponse = createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
      ROUTE_CONTEXT
    )
    const headers = new Headers(errorResponse.headers)
    headers.set('X-Request-ID', requestId)
    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers,
    })
  }
}
