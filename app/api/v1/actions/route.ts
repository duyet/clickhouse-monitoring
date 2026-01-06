import {
  createValidationError,
  getHostIdFromParams,
  withApiHandler,
} from '@/lib/api/error-handler'
import { type Action, ActionSchema } from '@/lib/api/schemas'
import { fetchData } from '@/lib/clickhouse'
import { ErrorLogger, generateRequestId, log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface ActionResult {
  success: boolean
  message: string
  data?: unknown
}

const ROUTE_CONTEXT = { route: '/api/v1/actions', method: 'POST' }

/**
 * Valid SQL identifier pattern for table names
 * Allows: database.table, table, `quoted.table`
 * Pattern: alphanumeric, underscores, dots, backtick-quoted identifiers
 */
const VALID_TABLE_IDENTIFIER =
  /^(`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*)(\.\s*(`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*))?$/

/**
 * Validate table identifier to prevent SQL injection
 * @param table - Table name to validate (e.g., "default.users", "system.query_log")
 * @returns true if valid, false if potentially malicious
 */
function isValidTableIdentifier(table: string): boolean {
  if (!table || table.length > 256) return false
  return VALID_TABLE_IDENTIFIER.test(table.trim())
}

async function handleKillQuery(
  hostId: number | string,
  queryId: string
): Promise<ActionResult> {
  const { error } = await fetchData({
    query: `KILL QUERY WHERE query_id = {queryId: String}`,
    query_params: { queryId },
    hostId: typeof hostId === 'string' ? parseInt(hostId, 10) : hostId,
  })

  if (error) {
    ErrorLogger.logError(new Error(error.message), {
      action: 'killQuery',
      queryId,
      errorType: error.type,
    })
    return {
      success: false,
      message: `Failed to kill query ${queryId}: ${error.message}`,
    }
  }

  return {
    success: true,
    message: `Killed query ${queryId}`,
  }
}

async function handleOptimizeTable(
  hostId: number | string,
  table: string
): Promise<ActionResult> {
  // SECURITY: Validate table identifier to prevent SQL injection
  if (!isValidTableIdentifier(table)) {
    ErrorLogger.logError(new Error('Invalid table identifier'), {
      action: 'optimizeTable',
      table,
      reason: 'Failed identifier validation',
    })
    return {
      success: false,
      message: `Invalid table identifier: ${table}. Table names must be alphanumeric with optional database prefix.`,
    }
  }

  const { error } = await fetchData({
    query: `OPTIMIZE TABLE ${table}`,
    hostId: typeof hostId === 'string' ? parseInt(hostId, 10) : hostId,
  })

  if (error) {
    ErrorLogger.logError(new Error(error.message), {
      action: 'optimizeTable',
      table,
      errorType: error.type,
    })
    return {
      success: false,
      message: `Failed to optimize table ${table}: ${error.message}`,
    }
  }

  return {
    success: true,
    message: `Running query optimize table ${table}`,
  }
}

async function handleQuerySettings(
  hostId: number | string,
  queryId: string
): Promise<ActionResult> {
  const { data, error } = await fetchData<{ Settings: string }[]>({
    query: `SELECT Settings FROM system.processes WHERE query_id = {queryId: String}`,
    query_params: { queryId },
    hostId: typeof hostId === 'string' ? parseInt(hostId, 10) : hostId,
  })

  if (error) {
    ErrorLogger.logError(new Error(error.message), {
      action: 'querySettings',
      queryId,
      errorType: error.type,
    })
    return {
      success: false,
      message: `Failed to get query settings ${queryId}: ${error.message}`,
    }
  }

  return {
    success: true,
    message: JSON.stringify(data),
    data,
  }
}

export const POST = withApiHandler(async (request: Request) => {
  // Generate request ID for correlation and tracing
  const requestId = generateRequestId()

  const { searchParams } = new URL(request.url)
  const hostId = getHostIdFromParams(searchParams, ROUTE_CONTEXT)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createValidationError('Invalid JSON body', ROUTE_CONTEXT)
  }

  // Parse and validate request body using Zod schema
  const parseResult = ActionSchema.safeParse(body)
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    return createValidationError(
      `Invalid action request: ${errorMessages}`,
      ROUTE_CONTEXT
    )
  }

  const action: Action = parseResult.data

  // Audit log for sensitive actions
  log('[AUDIT] Action requested', {
    requestId,
    action: action.action,
    hostId,
    params: action.params,
  })

  let result: ActionResult

  switch (action.action) {
    case 'killQuery':
      result = await handleKillQuery(hostId, action.params.queryId)
      break

    case 'optimizeTable':
      result = await handleOptimizeTable(hostId, action.params.table)
      break

    case 'querySettings':
      result = await handleQuerySettings(hostId, action.params.queryId)
      break
  }

  return Response.json(result, {
    status: result.success ? 200 : 500,
    headers: {
      'X-Request-ID': requestId,
    },
  })
}, ROUTE_CONTEXT)
