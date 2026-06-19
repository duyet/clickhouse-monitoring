/**
 * Explorer query endpoint
 * GET  /api/v1/explorer/query?hostId=0&sql=SELECT...&format=JSONEachRow&timezone=UTC
 * POST /api/v1/explorer/query  (body: { sql, hostId, format?, timezone? })
 *
 * Executes custom SQL queries from the explorer page.
 * Only SELECT queries are allowed; all queries run in readonly mode.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { DataFormat } from '@clickhouse/client'

import { env } from 'cloudflare:workers'
import { fetchData } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { validateSqlQuery } from '@chm/sql-builder'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { ApiErrorType } from '@/lib/api/types'
import { EXPLORER_QUERY_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'

const MAX_GET_QUERY_LENGTH = 8_000
const MAX_POST_QUERY_LENGTH = 100_000
const MAX_CELL_VALUE_LENGTH = 10_000

const SUPPORTED_FORMATS = ['JSONEachRow', 'JSON', 'CSV', 'TSV'] as const
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number]

function isSupportedFormat(format: string): format is SupportedFormat {
  return (SUPPORTED_FORMATS as readonly string[]).includes(format)
}

function truncateLargeValues<T>(data: T): T {
  if (!Array.isArray(data)) return data
  return data.map((row) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row))
      return row
    const truncated: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (typeof value === 'string' && value.length > MAX_CELL_VALUE_LENGTH) {
        truncated[key] =
          value.slice(0, MAX_CELL_VALUE_LENGTH) +
          `… (truncated, ${value.length} chars total)`
      } else {
        truncated[key] = value
      }
    }
    return truncated
  }) as T
}

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

function getSqlVerb(sql: string): string {
  const match = sql.trim().match(/^(\w+)/i)
  return match ? match[1].toUpperCase() : 'UNKNOWN'
}

async function executeQuery(params: {
  sql: string
  hostId: number
  format: string
  timezone: string | null
  method: string
  maxLength: number
}): Promise<Response> {
  const { sql, hostId, format, timezone, method, maxLength } = params

  if (!sql) {
    return Response.json(
      {
        success: false,
        error: {
          type: ApiErrorType.ValidationError,
          message: 'Missing required parameter: sql',
          details: { sql: 'missing' },
        },
      },
      { status: 400 }
    )
  }

  if (sql.length > maxLength) {
    return Response.json(
      {
        success: false,
        error: {
          type: ApiErrorType.ValidationError,
          message: `SQL query exceeds maximum length of ${maxLength} characters`,
          details: { length: sql.length, maxLength },
        },
      },
      { status: 400 }
    )
  }

  try {
    validateSqlQuery(sql)
  } catch (validationError) {
    return Response.json(
      {
        success: false,
        error: {
          type: ApiErrorType.ValidationError,
          message:
            validationError instanceof Error
              ? validationError.message
              : 'Invalid SQL query',
        },
      },
      { status: 400 }
    )
  }

  if (!isSupportedFormat(format)) {
    return Response.json(
      {
        success: false,
        error: {
          type: ApiErrorType.ValidationError,
          message: `Invalid format parameter. Allowed formats: ${SUPPORTED_FORMATS.join(', ')}`,
          details: { format },
        },
      },
      { status: 400 }
    )
  }

  debug(`[${method} /api/v1/explorer/query] Executing query:`, {
    sqlLength: sql.length,
    sqlVerb: getSqlVerb(sql),
    format,
    timezone,
  })

  const clickhouse_settings: Record<string, string | number> = { readonly: 1 }
  if (timezone) clickhouse_settings.session_timezone = timezone

  const result = await fetchData({
    query: sql,
    hostId,
    format: format as DataFormat,
    clickhouse_settings,
  })

  if (result.error) {
    error(`[${method} /api/v1/explorer/query] Query error:`, result.error)
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

  const truncatedData = truncateLargeValues(result.data)

  return Response.json(
    {
      success: true,
      data: truncatedData,
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
        'Cache-Control': 'private, max-age=0',
      },
    }
  )
}

export const Route = createFileRoute('/api/v1/explorer/query')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        // Arbitrary SQL execution is a WRITE capability: anonymous read-only
        // callers (CHM_CLERK_PUBLIC_READ) are blocked; authenticated callers and
        // API keys pass.
        const authError = await authorizeFeatureRequest(
          EXPLORER_QUERY_FEATURE_PERMISSION,
          request,
          { allowAgentBearerToken: true }
        )
        if (authError) return authError

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

        const sql = searchParams.get('sql') ?? ''
        const format = searchParams.get('format') ?? 'JSONEachRow'
        const timezone = searchParams.get('timezone')

        debug('[GET /api/v1/explorer/query]', { hostId, format, timezone })

        try {
          return await executeQuery({
            sql,
            hostId,
            format,
            timezone,
            method: 'GET',
            maxLength: MAX_GET_QUERY_LENGTH,
          })
        } catch (err) {
          error('[GET /api/v1/explorer/query] Unexpected error:', err)
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message:
                  err instanceof Error
                    ? err.message
                    : 'Unexpected error occurred',
              },
            },
            { status: 400 }
          )
        }
      },

      POST: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        // Arbitrary SQL execution is a WRITE capability (see GET handler).
        const authError = await authorizeFeatureRequest(
          EXPLORER_QUERY_FEATURE_PERMISSION,
          request,
          { allowAgentBearerToken: true }
        )
        if (authError) return authError

        let body: Record<string, unknown>
        try {
          body = (await request.json()) as Record<string, unknown>
        } catch {
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message: 'Invalid JSON request body',
              },
            },
            { status: 400 }
          )
        }

        const sql = typeof body.sql === 'string' ? body.sql : ''
        const hostIdParam = body.hostId
        const format =
          typeof body.format === 'string' ? body.format : 'JSONEachRow'
        const timezone =
          typeof body.timezone === 'string' ? body.timezone : null

        if (hostIdParam === undefined || hostIdParam === null) {
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

        const hostId = Number(hostIdParam)
        if (Number.isNaN(hostId)) {
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message: `Invalid hostId: ${String(hostIdParam)}. Must be a valid number.`,
              },
            },
            { status: 400 }
          )
        }

        debug('[POST /api/v1/explorer/query]', { hostId, format, timezone })

        try {
          return await executeQuery({
            sql,
            hostId,
            format,
            timezone,
            method: 'POST',
            maxLength: MAX_POST_QUERY_LENGTH,
          })
        } catch (err) {
          error('[POST /api/v1/explorer/query] Unexpected error:', err)
          return Response.json(
            {
              success: false,
              error: {
                type: ApiErrorType.ValidationError,
                message:
                  err instanceof Error
                    ? err.message
                    : 'Unexpected error occurred',
              },
            },
            { status: 400 }
          )
        }
      },
    },
  },
})
