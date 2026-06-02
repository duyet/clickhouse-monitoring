/**
 * Tables list endpoint
 * GET /api/v1/tables?hostId=0&limit=500
 *
 * Returns a lightweight list of tables for client-side autocomplete.
 * Excludes system databases and temporary tables.
 */

import type { ApiErrorType } from '@/lib/api/types'

import { fetchData } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { TABLES_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT: RouteContext = {
  route: '/api/v1/tables',
  method: 'GET',
}

const DEFAULT_LIMIT = 500
const MAX_LIMIT = 1000

interface TableRow {
  database: string
  name: string
  engine: string
  total_rows: string
}

export async function GET(request: Request): Promise<Response> {
  const permissionResponse = await authorizeFeatureRequest(
    TABLES_FEATURE_PERMISSION,
    request
  )
  if (permissionResponse) return permissionResponse

  const { searchParams } = new URL(request.url)
  const hostId = getHostIdFromParams(searchParams, ROUTE_CONTEXT)

  const rawLimit = searchParams.get('limit')
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : DEFAULT_LIMIT
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT

  debug('[GET /api/v1/tables]', { hostId, limit })

  const result = await fetchData<TableRow[]>({
    query: `
      SELECT
        database,
        name,
        engine,
        toString(total_rows) AS total_rows
      FROM system.tables
      WHERE database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
        AND NOT is_temporary
      ORDER BY total_bytes DESC NULLS LAST
      LIMIT {limit: UInt32}
    `,
    query_params: { limit },
    hostId,
    format: 'JSONEachRow',
  })

  if (result.error) {
    error('[GET /api/v1/tables] Query error:', result.error)
    return createApiErrorResponse(
      {
        type: result.error.type as ApiErrorType,
        message: result.error.message,
      },
      500,
      { ...ROUTE_CONTEXT, hostId }
    )
  }

  const rows = result.data ?? []
  return Response.json(
    {
      success: true,
      data: rows,
      metadata: {
        queryId: String(result.metadata.queryId || ''),
        rows: rows.length,
        host: String(result.metadata.host || ''),
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
