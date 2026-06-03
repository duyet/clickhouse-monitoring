/**
 * Batched menu count API endpoint
 * GET /api/v1/menu-counts?hostId=<n>
 *
 * Returns a map of every registered menu count key to its count in a single
 * request, so the sidebar makes ONE call instead of N independent ones.
 *
 * Optional-table misses resolve to `null`, matching the per-key endpoint's
 * behavior. A query failure on one key resolves that key to `null` rather than
 * failing the whole batch, so a single broken count never blanks out every
 * sidebar badge.
 *
 * SECURITY: No raw SQL is accepted from clients. Only pre-defined registry
 * queries are executed.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { fetchData } from '@chm/clickhouse-client'
import { debug, error, generateRequestId } from '@chm/logger'
import { createErrorResponse } from '@/lib/api/error-handler'
import {
  getAvailableMenuCountKeys,
  getMenuCountQuery,
} from '@/lib/api/menu-count-registry'
import { HostIdSchema } from '@/lib/api/schemas'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'

const ROUTE_CONTEXT = { route: '/api/v1/menu-counts', method: 'GET' }

interface MenuCountsResponse {
  readonly counts: Record<string, number | null>
}

/**
 * Resolves a single registry key to its count value for the given host.
 *
 * Returns `undefined` when the key has no registered query.
 * Returns `null` when the count is unavailable (optional table missing or
 * query failed). Returns a number otherwise.
 */
async function resolveCount(
  countKey: string,
  hostId: number,
  requestId: string
): Promise<number | null | undefined> {
  const menuCount = getMenuCountQuery(countKey)
  if (!menuCount) return undefined

  const result = await fetchData({
    query: menuCount.query,
    format: 'JSONEachRow',
    hostId,
  })

  if (result.error) {
    if (
      menuCount.optional &&
      result.error.type === ApiErrorType.TableNotFound
    ) {
      debug('[GET /api/v1/menu-counts] Optional table not found:', {
        requestId,
        countKey,
      })
      return null
    }

    error('[GET /api/v1/menu-counts] Query error:', undefined, {
      requestId,
      countKey,
      error: result.error.message,
    })
    return null
  }

  const data = result.data as Array<{ count?: number | string }>
  return data.length > 0 && data[0].count !== undefined
    ? Number(data[0].count)
    : null
}

async function handler(request: Request): Promise<Response> {
  const requestId = generateRequestId()

  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Validate hostId parameter
    const hostIdResult = HostIdSchema.safeParse(
      searchParams.get('hostId') ?? '0'
    )
    if (!hostIdResult.success) {
      error('[GET /api/v1/menu-counts] Invalid hostId parameter', undefined, {
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

    debug('[GET /api/v1/menu-counts] Fetching batched counts', {
      requestId,
      hostId,
    })

    bridgeClickHouseEnv(env as Record<string, string | undefined>)

    const keys = getAvailableMenuCountKeys()
    const resolved = await Promise.all(
      keys.map(async (key) => {
        const value = await resolveCount(key, hostId, requestId)
        return [key, value] as const
      })
    )

    const counts: Record<string, number | null> = {}
    for (const [key, value] of resolved) {
      if (value !== undefined) {
        counts[key] = value
      }
    }

    debug('[GET /api/v1/menu-counts] Batched count result:', {
      requestId,
      keys: Object.keys(counts).length,
    })

    const response = createSuccessResponse<MenuCountsResponse>(
      { counts },
      { queryId: 'menu-counts-batch', rows: Object.keys(counts).length }
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

export const Route = createFileRoute('/api/v1/menu-counts/')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
})
