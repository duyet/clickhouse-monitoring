/**
 * Proxy endpoint for executing queries against custom ClickHouse hosts
 * POST /api/v1/proxy
 *
 * Accepts a custom connection config and query, proxies the request
 * to the specified ClickHouse host. Used for user-added custom hosts
 * that are not configured via environment variables.
 */

import type { DataFormat } from '@clickhouse/client'

import type { FetchDataError } from '@/lib/clickhouse'
import type { ClickHouseConfig } from '@/lib/clickhouse/types'

import {
  createErrorResponse as createApiErrorResponse,
  createValidationError,
  withApiHandler,
} from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { mapErrorTypeToStatusCode } from '@/lib/api/shared/status-code-mapper'
import { validateSqlQuery } from '@/lib/api/shared/validators'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { error } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/proxy' }

interface ProxyRequestBody {
  query: string
  format?: DataFormat
  customConnection: {
    host: string
    user?: string
    password?: string
  }
  queryParams?: Record<string, string | number | boolean>
  timezone?: string
}

export const POST = withApiHandler(async (request: Request) => {
  const body = (await request.json()) as Partial<ProxyRequestBody>

  // Validate customConnection
  if (!body.customConnection?.host) {
    return createValidationError(
      'Missing required field: customConnection.host',
      { ...ROUTE_CONTEXT, method: 'POST' }
    )
  }

  // Validate query
  if (!body.query) {
    return createValidationError('Missing required field: query', {
      ...ROUTE_CONTEXT,
      method: 'POST',
    })
  }

  // Validate SQL safety
  try {
    validateSqlQuery(body.query)
  } catch (validationError) {
    return createValidationError(
      validationError instanceof Error
        ? validationError.message
        : 'SQL validation failed',
      { ...ROUTE_CONTEXT, method: 'POST' }
    )
  }

  const { query, format, customConnection, queryParams, timezone } =
    body as ProxyRequestBody

  // Build a ClickHouseConfig for the custom connection
  const clientConfig: ClickHouseConfig = {
    id: -1,
    host: customConnection.host,
    user: customConnection.user ?? 'default',
    password: customConnection.password ?? '',
  }

  // Execute the query via fetchData with the custom client config
  const result = await fetchData({
    query,
    format: (format || 'JSONEachRow') as DataFormat,
    query_params: queryParams,
    hostId: -1,
    clientConfig,
    clickhouse_settings: timezone ? { session_timezone: timezone } : undefined,
  })

  // Handle errors
  if (result.error) {
    error('[POST /api/v1/proxy] Query error:', result.error)
    return handleQueryError(result.error, 'POST')
  }

  return createSuccessResponse(result.data, { ...result.metadata, timezone })
}, ROUTE_CONTEXT)

function handleQueryError(
  queryError: FetchDataError,
  method: string
): Response {
  const errorTypeMap: Record<FetchDataError['type'], ApiErrorType> = {
    table_not_found: ApiErrorType.TableNotFound,
    validation_error: ApiErrorType.ValidationError,
    query_error: ApiErrorType.QueryError,
    network_error: ApiErrorType.NetworkError,
    permission_error: ApiErrorType.PermissionError,
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
    { ...ROUTE_CONTEXT, method }
  )
}
