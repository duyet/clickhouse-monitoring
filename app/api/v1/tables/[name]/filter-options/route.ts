/**
 * Filter options endpoint
 * GET /api/v1/tables/[name]/filter-options?hostId=0&key=user
 *
 * Returns the distinct values for a `select` filter field that declares
 * `dynamicOptions`. Table and column come exclusively from the trusted
 * filter schema — the request only supplies the (validated) config name and
 * field key, never raw SQL identifiers.
 */

import {
  createErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { getTableConfig } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT: RouteContext = {
  route: '/api/v1/tables/[name]/filter-options',
  method: 'GET',
}

interface FilterOption {
  value: string
  count: number
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
): Promise<Response> {
  const { name } = await params
  const { searchParams } = new URL(request.url)
  const routeContext = { ...ROUTE_CONTEXT, tableName: name }

  const hostId = getHostIdFromParams(searchParams, routeContext)
  const key = searchParams.get('key')

  if (!key) {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Missing required parameter: key',
      },
      400,
      routeContext
    )
  }

  const config = getTableConfig(name)
  const field = config?.filterSchema?.fields.find((f) => f.key === key)

  if (!field?.dynamicOptions) {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `Filter field "${key}" does not provide dynamic options`,
      },
      404,
      routeContext
    )
  }

  const { table, column, where } = field.dynamicOptions
  const whereClause = where
    ? `WHERE ${where} AND notEmpty(toString(${column}))`
    : `WHERE notEmpty(toString(${column}))`
  const sql = `
    SELECT
      ${column} AS value,
      count() AS count
    FROM ${table}
    ${whereClause}
    GROUP BY value
    ORDER BY count DESC
    LIMIT 200`

  const result = await fetchData<FilterOption[]>({
    query: sql,
    hostId,
    format: 'JSONEachRow',
  })

  if (result.error) {
    error(
      `[GET /api/v1/tables/${name}/filter-options] Query error:`,
      result.error
    )
    return createErrorResponse(
      {
        type: result.error.type as ApiErrorType,
        message: result.error.message,
      },
      500,
      { ...routeContext, hostId }
    )
  }

  return Response.json(
    { options: result.data ?? [] },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    }
  )
}
