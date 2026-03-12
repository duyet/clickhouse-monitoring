/**
 * Explain Query endpoint
 * GET /api/v1/explain?hostId=0&query=SELECT...
 *
 * Executes EXPLAIN on the provided query and returns the execution plan.
 *
 * Optional parameters:
 *   mode         - EXPLAIN mode: PIPELINE, AST, SYNTAX, ESTIMATE (default: PLAN)
 *   planSettings - Comma-separated key=value pairs for EXPLAIN PLAN settings.
 *                  Valid keys: optimize, header, description, indexes,
 *                  projections, actions, sorting, keep_logical_steps, json,
 *                  distributed.
 *                  Values must be 0 or 1. Only non-default values need to be sent.
 *
 * @example
 * GET /api/v1/explain?hostId=0&query=SELECT+1&planSettings=indexes%3D1%2Cactions%3D1
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
import { fetchData, QUERY_COMMENT } from '@/lib/clickhouse'
import { debug, error as logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/explain', method: 'GET' }

/**
 * Valid ClickHouse EXPLAIN modes. PLAN is excluded -- the UI Plan tab sends
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

const VALID_PLAN_SETTING_KEYS = new Set([
  'optimize',
  'header',
  'description',
  'indexes',
  'projections',
  'actions',
  'sorting',
  'keep_logical_steps',
  'json',
  'distributed',
])

/**
 * Parse and validate the planSettings parameter.
 * Expects comma-separated key=value pairs where value is 0 or 1.
 * Returns the settings clause string (e.g. "indexes = 1, actions = 1 ")
 * or an error message.
 */
function parsePlanSettings(
  raw: string
): { clause: string } | { error: string } {
  if (!raw) return { clause: '' }

  const pairs = raw.split(',')
  const validated: string[] = []

  for (const pair of pairs) {
    const trimmed = pair.trim()
    if (!trimmed) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      return {
        error: `Invalid plan setting format: "${trimmed}". Expected key=value.`,
      }
    }

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()

    if (!VALID_PLAN_SETTING_KEYS.has(key)) {
      return {
        error: `Unknown plan setting: "${key}". Valid settings: ${Array.from(VALID_PLAN_SETTING_KEYS).join(', ')}`,
      }
    }

    if (value !== '0' && value !== '1') {
      return {
        error: `Invalid value for "${key}": "${value}". Must be 0 or 1.`,
      }
    }

    validated.push(`${key} = ${value}`)
  }

  if (validated.length === 0) return { clause: '' }
  return { clause: `${validated.join(', ')} ` }
}

/**
 * Handle GET requests for EXPLAIN queries
 * Accepts query via URL query string
 *
 * @example
 * GET /api/v1/explain?hostId=0&query=SELECT%20count()%20FROM%20system.tables
 * GET /api/v1/explain?hostId=0&query=SELECT%201&planSettings=indexes%3D1
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

  // Parse EXPLAIN PLAN settings (only applicable when mode is PLAN / empty)
  const planSettingsRaw = searchParams.get('planSettings') || ''
  let settingsClause = ''

  // planSettings can only be used with PLAN mode (empty string)
  // modeParam='' means PLAN, so we allow planSettings with modeParam=''
  if (planSettingsRaw && modeParam && modeParam !== '') {
    return createValidationError(
      'planSettings can only be used with PLAN mode (empty mode parameter)',
      ROUTE_CONTEXT
    )
  }

  if (planSettingsRaw && !modeParam) {
    const result = parsePlanSettings(planSettingsRaw)
    if ('error' in result) {
      return createValidationError(result.error, ROUTE_CONTEXT)
    }
    settingsClause = result.clause
  }

  debug('[GET /api/v1/explain]', {
    hostId,
    queryLength: query.length,
    mode: modeParam || 'PLAN',
    planSettings: settingsClause || '(defaults)',
  })

  // Build EXPLAIN query.
  // When plan settings are provided, use explicit "EXPLAIN PLAN <settings>"
  // so the settings clause has a valid position in the grammar.
  // All queries include QUERY_COMMENT for attribution and tracking.
  let explainQuery: string
  if (settingsClause) {
    explainQuery = `${QUERY_COMMENT}EXPLAIN PLAN ${settingsClause.trim()} ${query}`
  } else if (modeParam) {
    explainQuery = `${QUERY_COMMENT}EXPLAIN ${modeParam} ${query}`
  } else {
    explainQuery = `${QUERY_COMMENT}EXPLAIN ${query}`
  }

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
