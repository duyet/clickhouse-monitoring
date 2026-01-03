import { fetchData } from '@/lib/clickhouse'
import {
  createValidationError,
  getHostIdFromParams,
  withApiHandler,
} from '@/lib/api/error-handler'
import { ErrorLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type ActionType = 'killQuery' | 'optimizeTable' | 'querySettings'

interface ActionRequest {
  action: ActionType
  params: Record<string, unknown>
}

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
  const { searchParams } = new URL(request.url)
  const hostId = getHostIdFromParams(searchParams, ROUTE_CONTEXT)

  let body: ActionRequest
  try {
    body = await request.json()
  } catch {
    return createValidationError('Invalid JSON body', ROUTE_CONTEXT)
  }

  const { action, params } = body

  if (!action || !params) {
    return createValidationError('Missing action or params', ROUTE_CONTEXT)
  }

  let result: ActionResult

  switch (action) {
    case 'killQuery':
      if (typeof params.queryId !== 'string') {
        return createValidationError('queryId must be a string', ROUTE_CONTEXT)
      }
      result = await handleKillQuery(hostId, params.queryId)
      break

    case 'optimizeTable':
      if (typeof params.table !== 'string') {
        return createValidationError('table must be a string', ROUTE_CONTEXT)
      }
      result = await handleOptimizeTable(hostId, params.table)
      break

    case 'querySettings':
      if (typeof params.queryId !== 'string') {
        return createValidationError('queryId must be a string', ROUTE_CONTEXT)
      }
      result = await handleQuerySettings(hostId, params.queryId)
      break

    default:
      return createValidationError(`Unknown action: ${action}`, ROUTE_CONTEXT)
  }

  return Response.json(result, {
    status: result.success ? 200 : 500,
  })
}, ROUTE_CONTEXT)
