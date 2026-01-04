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

import { createErrorResponse } from '@/lib/api/error-handler'
import {
  getMenuCountQuery,
  hasMenuCountKey,
} from '@/lib/api/menu-count-registry'
import { HostIdSchema, MenuCountKeySchema } from '@/lib/api/schemas'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error, generateRequestId } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/menu-counts/[key]', method: 'GET' }

interface MenuCountResponse {
  readonly count: number | null
}

interface RouteParams {
  params: Promise<{ key: string }>
}

export async function GET(
  request: Request,
  context: RouteParams
): Promise<Response> {
  const requestId = generateRequestId()

  try {
    const { key: countKey } = await context.params
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Validate count key format
    const countKeyResult = MenuCountKeySchema.safeParse(countKey)
    if (!countKeyResult.success) {
      error('[GET /api/v1/menu-counts] Invalid count key format:', countKey, {
        requestId,
      })
      const errorResponse = createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Invalid count key format: ${countKey}`,
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

    // Validate count key exists in registry
    if (!hasMenuCountKey(countKey)) {
      error('[GET /api/v1/menu-counts] Count key not registered:', undefined, {
        requestId,
        countKey,
      })
      const errorResponse = createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Count key not found: ${countKey}`,
        },
        404,
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

    // Validate hostId parameter
    const hostIdResult = HostIdSchema.safeParse(
      searchParams.get('hostId') ?? '0'
    )
    if (!hostIdResult.success) {
      error('[GET /api/v1/menu-counts] Invalid hostId parameter', undefined, {
        requestId,
        countKey,
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

    debug('[GET /api/v1/menu-counts] Fetching count', {
      requestId,
      countKey,
      hostId,
    })

    // Get the pre-defined query from registry
    const menuCount = getMenuCountQuery(countKey)
    if (!menuCount) {
      error('[GET /api/v1/menu-counts] Count query not found:', undefined, {
        requestId,
        countKey,
      })
      const errorResponse = createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Count key not found in registry: ${countKey}`,
        },
        404,
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

    // Execute the query
    const result = await fetchData({
      query: menuCount.query,
      format: 'JSONEachRow',
      hostId,
    })

    // Handle errors - for optional tables, return null count
    if (result.error) {
      if (menuCount.optional) {
        debug('[GET /api/v1/menu-counts] Optional table not found:', {
          requestId,
          countKey,
        })

        const response = createSuccessResponse<MenuCountResponse>(
          { count: null },
          { queryId: `menu-count-${countKey}`, rows: 1 }
        )
        const headers = new Headers(response.headers)
        headers.set('X-Request-ID', requestId)
        headers.set('Cache-Control', CacheControl.MEDIUM)
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }

      error('[GET /api/v1/menu-counts] Query error:', undefined, {
        requestId,
        countKey,
        error: result.error.message,
      })
      const errorResponse = createErrorResponse(
        {
          type: result.error.type as ApiErrorType,
          message: result.error.message,
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

    // Extract count from result
    const data = result.data as Array<{ count?: number | string }>
    const count =
      data.length > 0 && data[0].count !== undefined
        ? Number(data[0].count)
        : null

    debug('[GET /api/v1/menu-counts] Count result:', {
      requestId,
      countKey,
      count,
    })

    const response = createSuccessResponse<MenuCountResponse>(
      { count },
      { queryId: `menu-count-${countKey}`, rows: 1 }
    )
    const headers = new Headers(response.headers)
    headers.set('X-Request-ID', requestId)
    headers.set('Cache-Control', CacheControl.MEDIUM)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (err) {
    error('[GET /api/v1/menu-counts] Unexpected error:', err, { requestId })
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
