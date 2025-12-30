/**
 * Menu count API endpoint
 * GET /api/v1/menu-counts/[key]
 *
 * Returns the count for a specific menu item based on a pre-defined query.
 * This endpoint only accepts whitelisted count keys to prevent SQL injection.
 *
 * SECURITY: No raw SQL is accepted from clients.
 * Only countKey identifiers are used to look up pre-defined queries.
 */

import { fetchData } from '@/lib/clickhouse'
import {
  getMenuCountQuery,
  hasMenuCountKey,
} from '@/lib/api/menu-count-registry'
import { ApiErrorType } from '@/lib/api/types'
import { createErrorResponse } from '@/lib/api/error-handler'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/menu-counts/[key]' }

interface RouteParams {
  params: Promise<{ key: string }>
}

export async function GET(
  request: Request,
  context: RouteParams
): Promise<Response> {
  try {
    const { key: countKey } = await context.params
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Validate count key exists in registry
    if (!hasMenuCountKey(countKey)) {
      error('[GET /api/v1/menu-counts] Invalid count key:', countKey)
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Invalid count key: ${countKey}`,
        },
        400,
        { ...ROUTE_CONTEXT, method: 'GET' }
      )
    }

    const hostIdParam = searchParams.get('hostId')
    const hostId = hostIdParam ? parseInt(hostIdParam, 10) : 0

    debug('[GET /api/v1/menu-counts]', { countKey, hostId })

    // Get the pre-defined query from registry
    const menuCount = getMenuCountQuery(countKey)
    if (!menuCount) {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Count key not found: ${countKey}`,
        },
        404,
        { ...ROUTE_CONTEXT, method: 'GET' }
      )
    }

    // Execute the query
    const result = await fetchData({
      query: menuCount.query,
      format: 'JSONEachRow',
      hostId,
    })

    // Handle errors - for optional tables, return null count
    if (result.error) {
      if (menuCount.optional) {
        debug('[GET /api/v1/menu-counts] Optional table not found:', countKey)
        return Response.json(
          { success: true, data: { count: null } },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
          }
        )
      }

      error('[GET /api/v1/menu-counts] Query error:', result.error)
      return createErrorResponse(
        {
          type: result.error.type as ApiErrorType,
          message: result.error.message,
        },
        500,
        { ...ROUTE_CONTEXT, method: 'GET', hostId }
      )
    }

    // Extract count from result
    const data = result.data as Array<{ count?: number | string }>
    const count =
      data.length > 0 && data[0].count !== undefined
        ? Number(data[0].count)
        : null

    return Response.json(
      { success: true, data: { count } },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (err) {
    error('[GET /api/v1/menu-counts] Unexpected error:', err)
    return createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
      ROUTE_CONTEXT
    )
  }
}
