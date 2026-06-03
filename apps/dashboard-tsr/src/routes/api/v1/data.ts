/**
 * Generic data endpoint for executing ClickHouse queries
 * POST /api/v1/data, GET /api/v1/data
 *
 * Accepts a query and parameters, returns data with metadata.
 * Includes caching headers for performance optimization.
 *
 * SECURITY: This endpoint validates that queries being executed are either:
 * 1. Pre-defined in the chart/table registries (recommended)
 * 2. Stored in the dashboard tables (for Chart Builder)
 * This prevents clients from sending arbitrary SQL queries.
 *
 * Ported from apps/dashboard/app/api/v1/data/route.ts.
 * - Per-route feature-permission auth (authorizeFeatureRequest) is DROPPED:
 *   it is centralized in middleware (#1397), matching merged charts/tables routes.
 * - The shared @/lib/api/error-handler / response-builder / status-code-mapper /
 *   validators modules are not yet ported into this app, so their behavior is
 *   inlined below (response shapes and validation logic are identical).
 */

import type { DataFormat } from '@clickhouse/client'
import { createFileRoute } from '@tanstack/react-router'

import type { FetchDataError } from '@chm/clickhouse-client'
import type { ApiError, ApiRequest, ApiResponse } from '@/lib/api/types'

import { env } from 'cloudflare:workers'
import { fetchData } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { validateSqlQuery } from '@chm/sql-builder'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { getTableConfig } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'
import { validateDashboardQuery } from '@/lib/api/data/dashboard-query-validator'

const ROUTE_CONTEXT = { route: '/api/v1/data' } as const

interface RouteContext {
  readonly route?: string
  readonly method?: string
  readonly hostId?: number | string
}

// ---------------------------------------------------------------------------
// Inlined response builders (mirror @/lib/api/shared/response-builder and
// @/lib/api/error-handler — identical response shapes).
// ---------------------------------------------------------------------------

const SUCCESS_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
} as const

function createSuccessResponse<T>(
  data: T,
  meta?: {
    readonly queryId?: string | number
    readonly duration?: number
    readonly rows?: number
    readonly sql?: string
    readonly timezone?: string
    readonly [key: string]: unknown
  }
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      queryId: meta?.queryId ? String(meta.queryId) : '',
      duration: meta?.duration ? Number(meta.duration) : 0,
      rows: meta?.rows ? Number(meta.rows) : 0,
      host: '',
      ...(meta?.sql && { sql: String(meta.sql) }),
      ...(meta?.timezone && { timezone: String(meta.timezone) }),
    },
  }

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...SUCCESS_CACHE_HEADERS,
    },
  })
}

function createApiErrorResponse(
  apiError:
    | ApiError
    | { type: ApiErrorType; message: string; details?: ApiError['details'] },
  status: number,
  context?: RouteContext
): Response {
  const response: ApiResponse = {
    success: false,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: String(context?.hostId || 'unknown'),
    },
    error: apiError,
  }

  return Response.json(response, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createValidationError(
  message: string,
  context?: RouteContext
): Response {
  return createApiErrorResponse(
    { type: ApiErrorType.ValidationError, message },
    400,
    context
  )
}

const ERROR_TYPE_STATUS_MAP: Readonly<Record<ApiErrorType, number>> = {
  [ApiErrorType.ValidationError]: 400,
  [ApiErrorType.PermissionError]: 403,
  [ApiErrorType.TableNotFound]: 404,
  [ApiErrorType.NetworkError]: 503,
  [ApiErrorType.QueryError]: 500,
  [ApiErrorType.SslError]: 503,
  [ApiErrorType.TimeoutError]: 504,
}

function mapErrorTypeToStatusCode(errorType: ApiErrorType): number {
  return ERROR_TYPE_STATUS_MAP[errorType] ?? 500
}

// ---------------------------------------------------------------------------
// Inlined validators (mirror @/lib/api/shared/validators).
// ---------------------------------------------------------------------------

function validateSearchParams(
  searchParams: URLSearchParams,
  requiredParams: string[]
): ApiError | undefined {
  for (const param of requiredParams) {
    const value = searchParams.get(param)
    if (!value || value.trim() === '') {
      return {
        type: ApiErrorType.ValidationError,
        message: `Missing required parameter: ${param}`,
      }
    }
  }
  return undefined
}

function getAndValidateHostId(
  searchParams: URLSearchParams
): number | ApiError {
  const hostId = searchParams.get('hostId')
  if (!hostId) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required parameter: hostId',
    }
  }

  const parsed = Number.parseInt(hostId, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid hostId: must be a non-negative number',
    }
  }
  return parsed
}

const SUPPORTED_FORMATS = ['JSONEachRow', 'JSON', 'CSV', 'TSV'] as const

function validateFormat(format: unknown): ApiError | undefined {
  if (format === undefined || format === null) return undefined
  if (typeof format !== 'string') {
    return {
      type: ApiErrorType.ValidationError,
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }
  if (
    !SUPPORTED_FORMATS.includes(format as (typeof SUPPORTED_FORMATS)[number])
  ) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }
  return undefined
}

function validateHostIdWithError(hostId: unknown): ApiError | undefined {
  if (hostId === undefined || hostId === null || hostId === '') {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required field: hostId',
    }
  }

  const parsed =
    typeof hostId === 'number'
      ? hostId
      : typeof hostId === 'string'
        ? Number.parseInt(hostId, 10)
        : Number.NaN

  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid hostId: must be a non-negative number',
    }
  }
  return undefined
}

function validateRequiredString(
  value: unknown,
  fieldName: string
): ApiError | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      type: ApiErrorType.ValidationError,
      message: `Missing required field: ${fieldName}`,
    }
  }
  return undefined
}

function validateDataRequest(body: Partial<ApiRequest>): ApiError | undefined {
  const queryError = validateRequiredString(body.query, 'query')
  if (queryError) return queryError

  const hostIdError = validateHostIdWithError(body.hostId)
  if (hostIdError) return hostIdError

  const formatError = validateFormat(body.format)
  if (formatError) return formatError

  return undefined
}

// ---------------------------------------------------------------------------
// Inlined error classifier (mirror @/lib/api/error-handler/error-classifier).
// ---------------------------------------------------------------------------

function classifyError(err: unknown): { type: ApiErrorType; message: string } {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'An unexpected error occurred'
  const normalized = message.toLowerCase()

  if (
    normalized.includes('table') &&
    (normalized.includes('not found') ||
      normalized.includes("doesn't exist") ||
      normalized.includes('does not exist') ||
      normalized.includes('missing'))
  ) {
    return { type: ApiErrorType.TableNotFound, message }
  }

  const patterns: Array<{ type: ApiErrorType; keywords: string[] }> = [
    {
      type: ApiErrorType.PermissionError,
      keywords: ['permission', 'access denied', 'unauthorized', 'forbidden'],
    },
    {
      type: ApiErrorType.NetworkError,
      keywords: [
        'network',
        'connection',
        'econnrefused',
        'enotfound',
        'connect failed',
      ],
    },
    {
      type: ApiErrorType.TimeoutError,
      keywords: ['timeout', 'etimedout', 'socket timeout'],
    },
    {
      type: ApiErrorType.SslError,
      keywords: ['ssl', 'tls', 'certificate', 'handshake', '525', '526'],
    },
    {
      type: ApiErrorType.ValidationError,
      keywords: [
        'invalid',
        'missing',
        'required',
        'malformed',
        'syntax error',
        'parse error',
      ],
    },
  ]

  for (const { type, keywords } of patterns) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return { type, message }
    }
  }

  return { type: ApiErrorType.QueryError, message }
}

/**
 * Wrap a handler so uncaught errors are classified into a standardized
 * error response (mirror @/lib/api/error-handler withApiHandler).
 */
function withApiHandler(
  handler: (request: Request) => Promise<Response>,
  context?: RouteContext
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request)
    } catch (err) {
      const { type, message } = classifyError(err)
      return createApiErrorResponse(
        {
          type,
          message,
          details: { timestamp: new Date().toISOString() },
        },
        mapErrorTypeToStatusCode(type),
        context
      )
    }
  }
}

/**
 * Handle query execution errors with proper status code mapping
 */
function handleQueryError(
  queryError: FetchDataError,
  hostId: string | number,
  method: string
): Response {
  const errorTypeMap: Record<FetchDataError['type'], ApiErrorType> = {
    table_not_found: ApiErrorType.TableNotFound,
    validation_error: ApiErrorType.ValidationError,
    query_error: ApiErrorType.QueryError,
    network_error: ApiErrorType.NetworkError,
    permission_error: ApiErrorType.PermissionError,
    ssl_error: ApiErrorType.SslError,
    timeout_error: ApiErrorType.TimeoutError,
  }

  const apiErrorType = errorTypeMap[queryError.type] ?? ApiErrorType.QueryError

  return createApiErrorResponse(
    {
      type: apiErrorType,
      message: queryError.message,
      details: queryError.details as Record<
        string,
        string | number | boolean | undefined
      >,
    },
    mapErrorTypeToStatusCode(apiErrorType),
    { ...ROUTE_CONTEXT, method, hostId }
  )
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Handle GET requests for data fetching
 * Accepts query and parameters via URL query string
 *
 * @example
 * GET /api/v1/data?hostId=0&sql=SELECT%20count()%20FROM%20system.tables&format=JSONEachRow
 */
const handleGet = withApiHandler(async (request: Request) => {
  bridgeClickHouseEnv(env as Record<string, string | undefined>)

  const url = new URL(request.url)
  const searchParams = url.searchParams

  // Parse query parameters from URL
  const query =
    searchParams.get('sql') || searchParams.get('query') || undefined
  const format = searchParams.get('format') as DataFormat | null
  const timezone = searchParams.get('timezone') || undefined

  // Validate required parameters
  const validationError = validateSearchParams(searchParams, ['hostId'])
  if (validationError) {
    return createValidationError(validationError.message, {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }

  if (!query) {
    return createValidationError('Missing required parameter: sql or query', {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }

  // SECURITY: Validate SQL query to prevent injection attacks
  try {
    validateSqlQuery(query)
  } catch (validationErr) {
    error('[GET /api/v1/data] Security: SQL validation failed', {
      queryPreview: query.substring(0, 100),
      error:
        validationErr instanceof Error
          ? validationErr.message
          : 'Unknown error',
    })
    return createValidationError(
      validationErr instanceof Error
        ? validationErr.message
        : 'SQL validation failed',
      { ...ROUTE_CONTEXT, method: 'GET' }
    )
  }

  // Get and validate hostId from search params
  const hostIdResult = getAndValidateHostId(searchParams)
  if (typeof hostIdResult !== 'number') {
    return createValidationError(hostIdResult.message, {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }
  const hostId = hostIdResult

  debug('[GET /api/v1/data]', {
    hostId,
    format: format || 'JSONEachRow',
    timezone,
  })

  // SECURITY: Validate GET query against dashboard allowlist to prevent
  // arbitrary SQL execution through query-string requests.
  const validationResult = await validateDashboardQuery(query, hostId)
  if (!validationResult.valid) {
    error('[GET /api/v1/data] Security: Query not found in dashboard tables', {
      queryPreview: query.substring(0, 100),
    })
    return createApiErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: validationResult.error?.message || 'Query validation failed',
      },
      403,
      { ...ROUTE_CONTEXT, method: 'GET', hostId }
    )
  }

  // Execute the query
  const result = await fetchData({
    query,
    format: (format || 'JSONEachRow') as DataFormat,
    hostId,
    // Pass timezone to ClickHouse for session-level time conversion
    clickhouse_settings: timezone ? { session_timezone: timezone } : undefined,
  })

  // Handle errors
  if (result.error) {
    error('[GET /api/v1/data] Query error:', result.error)
    return handleQueryError(result.error, hostId, 'GET')
  }

  // Create successful response with timezone in metadata
  return createSuccessResponse(result.data, { ...result.metadata, timezone })
}, ROUTE_CONTEXT)

/**
 * Handle POST requests for data fetching
 * Accepts query and parameters in the request body
 *
 * SECURITY: When queryConfig is not provided, validates that the query
 * exists in the dashboard tables to prevent arbitrary SQL execution.
 *
 * @example
 * POST /api/v1/data
 * {
 *   "query": "SELECT count() FROM system.tables",
 *   "hostId": 0,
 *   "format": "JSONEachRow"
 * }
 */
const handlePost = withApiHandler(async (request: Request) => {
  bridgeClickHouseEnv(env as Record<string, string | undefined>)

  // Parse request body
  const body = (await request.json()) as Partial<ApiRequest>

  // Validate required fields using shared validator
  const validationError = validateDataRequest(body)
  if (validationError) {
    return createApiErrorResponse(validationError, 400, {
      ...ROUTE_CONTEXT,
      method: 'POST',
    })
  }

  const typedBody = body as ApiRequest
  const {
    query,
    queryParams,
    hostId,
    format = 'JSONEachRow',
    queryConfigName,
    timezone,
  } = typedBody

  debug('[POST /api/v1/data]', {
    hostId,
    format,
    queryConfigName,
    timezone,
  })

  // SECURITY: Reject client-supplied QueryConfig objects to prevent SQL override attacks.
  if (
    typeof body === 'object' &&
    body !== null &&
    'queryConfig' in body &&
    (body as { queryConfig?: unknown }).queryConfig !== undefined
  ) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          'queryConfig is not accepted from clients. Use queryConfigName instead.',
      },
      400,
      { ...ROUTE_CONTEXT, method: 'POST', hostId }
    )
  }

  // SECURITY: If no queryConfigName provided, validate the query exists in dashboard tables
  // This prevents arbitrary SQL execution from clients
  if (!queryConfigName) {
    const validationResult = await validateDashboardQuery(query, Number(hostId))
    if (!validationResult.valid) {
      error(
        '[POST /api/v1/data] Security: Query not found in dashboard tables',
        {
          queryPreview: query.substring(0, 100),
        }
      )
      return createApiErrorResponse(
        {
          type: ApiErrorType.PermissionError,
          message: validationResult.error?.message || 'Query validation failed',
        },
        403,
        { ...ROUTE_CONTEXT, method: 'POST', hostId }
      )
    }
  }

  const serverQueryConfig = queryConfigName
    ? getTableConfig(queryConfigName)
    : undefined
  if (queryConfigName && !serverQueryConfig) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `Unknown query config: ${queryConfigName}`,
      },
      400,
      { ...ROUTE_CONTEXT, method: 'POST', hostId }
    )
  }

  // NOTE: per-route feature-permission gate (authorizeFeatureRequest) removed —
  // centralized in middleware (#1397). serverQueryConfig still feeds fetchData.

  // Convert format string to DataFormat if needed
  const dataFormat = (format || 'JSONEachRow') as DataFormat

  // Execute the query
  const result = await fetchData({
    query,
    query_params: queryParams,
    format: dataFormat,
    hostId,
    queryConfig: serverQueryConfig,
    // Pass timezone to ClickHouse for session-level time conversion
    clickhouse_settings: timezone ? { session_timezone: timezone } : undefined,
  })

  // Handle errors
  if (result.error) {
    error('[POST /api/v1/data] Query error:', result.error)
    return handleQueryError(result.error, hostId, 'POST')
  }

  // Create successful response with timezone in metadata
  return createSuccessResponse(result.data, { ...result.metadata, timezone })
}, ROUTE_CONTEXT)

export const Route = createFileRoute('/api/v1/data')({
  server: {
    handlers: {
      GET: async ({ request }) => handleGet(request),
      POST: async ({ request }) => handlePost(request),
    },
  },
})
