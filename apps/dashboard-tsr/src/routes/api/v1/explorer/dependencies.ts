/**
 * Explorer dependencies endpoint
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&table=users&direction=upstream|downstream
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&direction=database (all deps in database)
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&table=dict_name&direction=dictionary (dictionary source)
 *
 * Returns dependency information for a table (upstream or downstream) or entire database
 */

import { createFileRoute } from '@tanstack/react-router'

import type { ApiResponse } from '@/lib/api/types'

import { fetchData } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { env } from 'cloudflare:workers'
import { getHostIdFromParams, type RouteContext } from '@/lib/api/error-handler'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { getTableQuery } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'

const ROUTE = '/api/v1/explorer/dependencies'

function mapErrorTypeToStatusCode(errorType: ApiErrorType): number {
  const statusMap: Record<ApiErrorType, number> = {
    [ApiErrorType.ValidationError]: 400,
    [ApiErrorType.PermissionError]: 403,
    [ApiErrorType.TableNotFound]: 404,
    [ApiErrorType.NetworkError]: 503,
    [ApiErrorType.QueryError]: 500,
    [ApiErrorType.SslError]: 503,
    [ApiErrorType.TimeoutError]: 504,
  }
  return statusMap[errorType] ?? 500
}

function createSuccessResponse<T>(
  data: T,
  metadata: Record<string, string | number>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      queryId: String(metadata.queryId || ''),
      duration: Number(metadata.duration || 0),
      rows: Number(metadata.rows || 0),
      host: String(metadata.host || ''),
    },
  }
  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}

export const Route = createFileRoute('/api/v1/explorer/dependencies')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        const { searchParams } = new URL(request.url)
        const routeContext: RouteContext = { route: ROUTE, method: 'GET' }

        const hostId = getHostIdFromParams(searchParams, routeContext)
        const direction = searchParams.get('direction') || 'downstream'

        debug(`[GET ${ROUTE}]`, { hostId, direction })

        const searchParamsObj: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          if (key !== 'hostId' && key !== 'direction')
            searchParamsObj[key] = value
        })

        let configName: string
        switch (direction) {
          case 'upstream':
            configName = 'explorer-dependencies-upstream'
            break
          case 'downstream':
            configName = 'explorer-dependencies-downstream'
            break
          case 'database':
            configName = 'explorer-database-dependencies'
            break
          case 'dictionary':
            configName = 'explorer-dictionary-source'
            break
          case 'all':
            configName = 'explorer-all-dependencies'
            break
          case 'table':
            configName = 'explorer-table-dependencies'
            break
          default:
            configName = 'explorer-dependencies-downstream'
        }

        const queryDef = getTableQuery(configName, {
          hostId,
          searchParams: searchParamsObj,
        })

        if (!queryDef) {
          error(`[GET ${ROUTE}] Failed to build query`)
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.QueryError,
                message: 'Failed to build query for dependencies',
              },
            },
            { status: 500 }
          )
        }

        const result = await fetchData({
          query: queryDef.query,
          query_params: queryDef.queryParams,
          hostId,
          format: 'JSONEachRow',
        })

        if (result.error) {
          error(`[GET ${ROUTE}] Query error:`, result.error)
          return Response.json(
            {
              success: false,
              error: {
                type: result.error.type,
                message: result.error.message,
                details: result.error.details,
              },
            },
            {
              status: mapErrorTypeToStatusCode(
                result.error.type as ApiErrorType
              ),
            }
          )
        }

        return createSuccessResponse(result.data, result.metadata)
      },
    },
  },
})
