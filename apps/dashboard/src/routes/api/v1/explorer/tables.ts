/**
 * Explorer tables endpoint
 * GET /api/v1/explorer/tables?hostId=0&database=default
 *
 * Returns list of tables in a database.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { fetchData } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { getTableQuery } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'

function mapErrorTypeToStatusCode(errorType: string): number {
  const statusMap: Record<string, number> = {
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

export const Route = createFileRoute('/api/v1/explorer/tables')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        const { searchParams } = new URL(request.url)

        const hostIdRaw = searchParams.get('hostId')
        if (hostIdRaw === null || hostIdRaw === '') {
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message: 'Missing required parameter: hostId',
              },
            },
            { status: 400 }
          )
        }
        const hostId = Number(hostIdRaw)
        if (!Number.isInteger(hostId) || hostId < 0) {
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message: `Invalid hostId: ${hostIdRaw}`,
              },
            },
            { status: 400 }
          )
        }

        debug('[GET /api/v1/explorer/tables]', { hostId })

        const searchParamsObj: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          if (key !== 'hostId') searchParamsObj[key] = value
        })

        const queryDef = getTableQuery('explorer-tables', {
          hostId,
          searchParams: searchParamsObj,
        })

        if (!queryDef) {
          error('[GET /api/v1/explorer/tables] Failed to build query')
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.QueryError,
                message: 'Failed to build query for tables',
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
          error('[GET /api/v1/explorer/tables] Query error:', result.error)
          return Response.json(
            {
              success: false,
              error: {
                type: result.error.type,
                message: result.error.message,
                details: result.error.details,
              },
            },
            { status: mapErrorTypeToStatusCode(result.error.type) }
          )
        }

        return Response.json(
          {
            success: true,
            data: result.data,
            metadata: {
              queryId: String(result.metadata.queryId ?? ''),
              duration: Number(result.metadata.duration ?? 0),
              rows: Number(result.metadata.rows ?? 0),
              host: String(result.metadata.host ?? ''),
            },
          },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
          }
        )
      },
    },
  },
})
