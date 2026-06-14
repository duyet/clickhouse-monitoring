/**
 * Table data via server-stored user connection.
 * POST /api/v1/user-connections/tables/$name
 */

import { createFileRoute } from '@tanstack/react-router'

import { createValidationError } from '@/lib/api/error-handler'
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { executeConnectionTableConfig } from '@/lib/connection-query/execute-connection-table'
import { resolveConnectionStore } from '@/lib/connection-store/resolve-store'
import { getUserConnectionsServerConfig } from '@/lib/connection-store/server-feature'
import { ConnectionStoreError } from '@/lib/connection-store/types'
import { resolveUserId } from '@/lib/conversation-store/auth'
import { getQueryConfigByName } from '@/lib/query-config'

const ROUTE_CONTEXT = {
  route: '/api/v1/user-connections/tables/$name',
  method: 'POST',
} as const

interface TableBody {
  connectionId: string
  searchParams?: Record<string, string | number | boolean>
  timezone?: string
}

async function handlePost(
  request: Request,
  tableName: string
): Promise<Response> {
  if (!getUserConnectionsServerConfig().dbStorageEnabled) {
    return createErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: 'User connections database storage is not enabled.',
      },
      501,
      ROUTE_CONTEXT
    )
  }

  const queryConfig = getQueryConfigByName(tableName)
  if (!queryConfig) {
    return createErrorResponse(
      {
        type: ApiErrorType.TableNotFound,
        message: `Table query not found: ${tableName}`,
      },
      404,
      ROUTE_CONTEXT
    )
  }

  let body: Partial<TableBody>
  try {
    body = (await request.json()) as Partial<TableBody>
  } catch {
    return createValidationError(
      'Request body must be valid JSON',
      ROUTE_CONTEXT
    )
  }

  if (!body.connectionId) {
    return createValidationError(
      'Missing required field: connectionId',
      ROUTE_CONTEXT
    )
  }

  try {
    const userId = await resolveUserId()
    const store = await resolveConnectionStore()
    const credentials = await store.getCredentials(userId, body.connectionId)
    if (!credentials) {
      return createErrorResponse(
        {
          type: ApiErrorType.PermissionError,
          message: 'Connection not found',
        },
        404,
        ROUTE_CONTEXT
      )
    }

    const result = await executeConnectionTableConfig(
      queryConfig,
      credentials,
      body.searchParams,
      body.timezone
    )
    return createSuccessResponse(result.data, result.metadata)
  } catch (error) {
    if (error instanceof ConnectionStoreError) {
      return createErrorResponse(
        { type: ApiErrorType.PermissionError, message: error.message },
        error.code === 'UNAUTHORIZED' ? 401 : 500,
        ROUTE_CONTEXT
      )
    }
    return createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: error instanceof Error ? error.message : 'Table query failed',
      },
      500,
      ROUTE_CONTEXT
    )
  }
}

export const Route = createFileRoute('/api/v1/user-connections/tables/$name')({
  server: {
    handlers: {
      POST: async ({ request, params }) => handlePost(request, params.name),
    },
  },
})
