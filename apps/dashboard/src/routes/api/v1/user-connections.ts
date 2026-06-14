/**
 * User connections API
 * GET  /api/v1/user-connections — list (metadata only)
 * POST /api/v1/user-connections — create
 */

import { createFileRoute } from '@tanstack/react-router'

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { validateHostUrl } from '@/lib/browser-connections/host-url'
import { queryConnection } from '@/lib/connection-query/connection-client'
import { resolveConnectionStore } from '@/lib/connection-store/resolve-store'
import { getUserConnectionsServerConfig } from '@/lib/connection-store/server-feature'
import {
  ConnectionStoreError,
  type CreateUserConnectionInput,
} from '@/lib/connection-store/types'
import { resolveUserId } from '@/lib/conversation-store/auth'

const ROUTE_GET = { route: '/api/v1/user-connections', method: 'GET' }
const ROUTE_POST = { route: '/api/v1/user-connections', method: 'POST' }

function mapStoreError(error: unknown, context: typeof ROUTE_GET): Response {
  if (error instanceof ConnectionStoreError) {
    const status =
      error.code === 'UNAUTHORIZED'
        ? 401
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'NOT_CONFIGURED'
            ? 501
            : 500
    return createApiErrorResponse(
      { type: ApiErrorType.PermissionError, message: error.message },
      status,
      context
    )
  }
  return createApiErrorResponse(
    {
      type: ApiErrorType.InternalError,
      message: error instanceof Error ? error.message : 'Unknown error',
    },
    500,
    context
  )
}

async function handleGet(): Promise<Response> {
  if (!getUserConnectionsServerConfig().dbStorageEnabled) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: 'User connections database storage is not enabled.',
      },
      501,
      ROUTE_GET
    )
  }

  try {
    const userId = await resolveUserId()
    const store = await resolveConnectionStore()
    const connections = await store.list(userId)
    return createSuccessResponse(
      connections.map((c) => ({
        id: c.id,
        name: c.name,
        host: c.hostUrl,
        user: c.chUser,
        hostId: c.hostId,
        source: 'database' as const,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    )
  } catch (error) {
    return mapStoreError(error, ROUTE_GET)
  }
}

interface CreateRequest {
  name: string
  host: string
  user: string
  password: string
}

async function handlePost(request: Request): Promise<Response> {
  if (!getUserConnectionsServerConfig().dbStorageEnabled) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: 'User connections database storage is not enabled.',
      },
      501,
      ROUTE_POST
    )
  }

  let body: Partial<CreateRequest>
  try {
    body = (await request.json()) as Partial<CreateRequest>
  } catch {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Request body must be valid JSON',
      },
      400,
      ROUTE_POST
    )
  }

  const { name, host, user, password } = body
  if (
    !name?.trim() ||
    !host?.trim() ||
    !user?.trim() ||
    typeof password !== 'string'
  ) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'name, host, user, and password are required',
      },
      400,
      ROUTE_POST
    )
  }

  const ssrfError = await validateHostUrl(host.trim())
  if (ssrfError) {
    return createApiErrorResponse(
      { type: ApiErrorType.ValidationError, message: ssrfError },
      400,
      ROUTE_POST
    )
  }

  const credentials = {
    host: host.trim(),
    user: user.trim(),
    password,
  }

  try {
    await queryConnection(credentials, 'SELECT 1')
  } catch (err) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: err instanceof Error ? err.message : 'Connection test failed',
      },
      400,
      ROUTE_POST
    )
  }

  try {
    const userId = await resolveUserId()
    const store = await resolveConnectionStore()
    const input: CreateUserConnectionInput = {
      name: name.trim(),
      hostUrl: credentials.host,
      chUser: credentials.user,
      credentials,
    }
    const created = await store.create(userId, input)
    return createSuccessResponse({
      id: created.id,
      name: created.name,
      host: created.hostUrl,
      user: created.chUser,
      hostId: created.hostId,
      source: 'database' as const,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    })
  } catch (error) {
    return mapStoreError(error, ROUTE_POST)
  }
}

export const Route = createFileRoute('/api/v1/user-connections')({
  server: {
    handlers: {
      GET: async () => handleGet(),
      POST: async ({ request }) => handlePost(request),
    },
  },
})
