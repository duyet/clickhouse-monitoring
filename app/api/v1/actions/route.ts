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
