/**
 * Explain Query endpoint
 * GET /api/v1/explain?hostId=0&query=SELECT...
 *
 * Executes EXPLAIN on the provided query and returns the execution plan.
 */

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createValidationError,
} from '@/lib/api/error-handler'
import { createCachedResponse } from '@/lib/api/shared/response-builder'
import { mapErrorTypeToStatusCode } from '@/lib/api/shared/status-code-mapper'
import { getAndValidateHostId } from '@/lib/api/shared/validators'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error as logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/explain', method: 'GET' }

/**
 * Valid ClickHouse EXPLAIN modes. PLAN is excluded — the UI Plan tab sends
 * mode='' (empty string) which maps to plain EXPLAIN (same as EXPLAIN PLAN).
 * This keeps the allowlist in sync with the UI so PLAN is never unreachable.
 */
const VALID_EXPLAIN_MODES = [
  '',
  'PIPELINE',
  'AST',
  'SYNTAX',
  'ESTIMATE',
] as const
type ExplainMode = (typeof VALID_EXPLAIN_MODES)[number]

/**
 * Handle GET requests for EXPLAIN queries
 * Accepts query via URL query string
 *
 * @example
 * GET /api/v1/explain?hostId=0&query=SELECT%20count()%20FROM%20system.tables
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)

  // Validate required parameters
  const validationError = validateSearchParams(searchParams)
  if (validationError) {
    return createValidationError(validationError.message, ROUTE_CONTEXT)
  }

  // Get and validate hostId
  const hostIdResult = getAndValidateHostId(searchParams)
  if (typeof hostIdResult !== 'number') {
    return createValidationError(hostIdResult.message, ROUTE_CONTEXT)
  }
  const hostId = hostIdResult

  // Get and validate query parameter
  const query = searchParams.get('query')
  if (!query || query.trim() === '') {
    return createValidationError(
      'Missing required parameter: query',
      ROUTE_CONTEXT
    )
  }

  // Validate query length
  if (query.length > 100000) {
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Query is too long (maximum 100000 characters)',
      },
      400,
      { ...ROUTE_CONTEXT, hostId }
    )
  }

  // SECURITY: Validate SQL query to prevent injection attacks
  // Only allow SELECT and WITH queries to be explained
  try {
    validateSqlQuery(query)
  } catch (validationError) {
    logError('[GET /api/v1/explain] Security: SQL validation failed', {
      queryPreview: query.substring(0, 100),
      error:
        validationError instanceof Error
          ? validationError.message
          : 'Unknown error',
    })
    return createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          validationError instanceof Error
            ? validationError.message
            : 'SQL validation failed',
      },
      400,
      { ...ROUTE_CONTEXT, hostId }
    )
  }

  // Get and validate explain mode
  const modeParam = (searchParams.get('mode') || '').toUpperCase()
  if (modeParam && !VALID_EXPLAIN_MODES.includes(modeParam as ExplainMode)) {
    return createValidationError(
      `Invalid explain mode: ${modeParam}. Valid modes: ${VALID_EXPLAIN_MODES.filter(Boolean).join(', ')}`,
      ROUTE_CONTEXT
    )
  }

  debug('[GET /api/v1/explain]', {
    hostId,
    queryLength: query.length,
    mode: modeParam || 'default',
  })

  // Wrap query with EXPLAIN [MODE]
  const modePrefix = modeParam ? `EXPLAIN ${modeParam}` : 'EXPLAIN'
  const explainQuery = `${modePrefix} ${query}`

  // Execute the query
  const result = await fetchData({
    query: explainQuery,
    hostId,
    format: 'JSONEachRow',
  })

  // Handle errors
  if (result.error) {
    logError('[GET /api/v1/explain] Query error:', result.error)

    // Map FetchDataError type to ApiErrorType
    const errorTypeMap: Record<string, ApiErrorType> = {
      table_not_found: ApiErrorType.TableNotFound,
      validation_error: ApiErrorType.ValidationError,
      query_error: ApiErrorType.QueryError,
      network_error: ApiErrorType.NetworkError,
      permission_error: ApiErrorType.PermissionError,
    }

    const apiErrorType =
      errorTypeMap[result.error.type] ?? ApiErrorType.QueryError

    return createErrorResponse(
      {
        type: apiErrorType,
        message: result.error.message,
        details: result.error.details as Record<
          string,
          string | number | boolean | undefined
        >,
      },
      mapErrorTypeToStatusCode(apiErrorType),
      { ...ROUTE_CONTEXT, hostId }
    )
  }

  // Create successful response with no-cache headers
  return createCachedResponse(
    result.data,
    'no-store, no-cache, must-revalidate',
    {
      sql: explainQuery,
      rows: Number(result.metadata.rows || 0),
      duration: Number(result.metadata.duration || 0),
      queryId: String(result.metadata.queryId || ''),
    }
  )
}

/**
 * Validate required search parameters
 */
function validateSearchParams(
  searchParams: URLSearchParams
): { message: string } | null {
  const requiredParams = ['hostId', 'query']

  for (const param of requiredParams) {
    const value = searchParams.get(param)
    if (!value || value.trim() === '') {
      return { message: `Missing required parameter: ${param}` }
    }
  }

  return null
}
