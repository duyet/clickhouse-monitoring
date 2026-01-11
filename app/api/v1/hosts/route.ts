/**
 * Hosts API endpoint
 * GET /api/v1/hosts - List all configured hosts (env + database)
 * POST /api/v1/hosts - Add new host to database (requires authentication)
 *
 * Returns information about all configured ClickHouse hosts
 * Excludes sensitive information like passwords
 */

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { encryptPassword, isEncryptionAvailable } from '@/lib/auth/encryption'
import { getClickHouseConfigs } from '@/lib/clickhouse'
import { getDb } from '@/lib/db'
import { ClickhouseHostRepository } from '@/lib/db/repositories/clickhouse-host'
import { debug, error, generateRequestId } from '@/lib/logger'
import { getHost } from '@/lib/utils'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_GET = { route: '/api/v1/hosts', method: 'GET' }
const ROUTE_CONTEXT_POST = { route: '/api/v1/hosts', method: 'POST' }

/**
 * Host information for public API responses
 */
export interface HostInfo {
  readonly id: number
  readonly name: string
  readonly host: string
  readonly user: string
}

/**
 * Handle GET requests for hosts list
 */
export async function GET(): Promise<Response> {
  const requestId = generateRequestId()
  debug('[GET /api/v1/hosts] Fetching host configurations', { requestId })

  try {
    // Get all configured hosts
    const configs = getClickHouseConfigs()

    // Transform to public API format (exclude passwords)
    const hosts: HostInfo[] = configs.map((config) => ({
      id: config.id,
      name: config.customName || getHost(config.host) || `Host ${config.id}`,
      host: config.host,
      user: config.user,
    }))

    // Create response with standardized builder
    const response = createSuccessResponse(hosts, {
      queryId: 'hosts-list',
      rows: hosts.length,
    })

    // Add request ID header
    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Request-ID', requestId)
    newHeaders.set('Cache-Control', CacheControl.LONG)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[GET /api/v1/hosts] Error:', err, { requestId })

    const errorResponse = createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT_GET
    )

    // Add request ID header to error response
    const errorHeaders = new Headers(errorResponse.headers)
    errorHeaders.set('X-Request-ID', requestId)

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: errorHeaders,
    })
  }
}

/**
 * Request body for creating a new host
 */
interface CreateHostRequest {
  name: string
  host: string
  username: string
  password: string
  organizationId?: string
}

/**
 * Handle POST requests to create new host
 * Requires authentication and encryption to be available
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[POST /api/v1/hosts] Creating new host', { requestId })

  try {
    // Check if encryption is available (AUTH_SECRET is required)
    if (!isEncryptionAvailable()) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Host management requires AUTH_SECRET to be configured',
          details: {
            hint: 'Set AUTH_SECRET environment variable to enable host management',
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Get session from Better Auth
    const { getAuth } = await import('@/lib/auth/better-auth')
    const auth = await getAuth()

    // Verify the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    })

    if (!sessionResponse?.user) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.PermissionError,
          message: 'Authentication required to add hosts',
          details: {
            hint: 'Please sign in to add ClickHouse hosts',
          },
        },
        401,
        ROUTE_CONTEXT_POST
      )
    }

    const user = sessionResponse.user

    // Parse request body
    const body = (await request.json()) as CreateHostRequest

    // Validate required fields
    if (!body.name || !body.host || !body.username || !body.password) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required fields',
          details: {
            required: ['name', 'host', 'username', 'password'],
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Get organization ID - use provided or get user's default org
    let organizationId = body.organizationId

    if (!organizationId) {
      // Try to get user's first organization (personal org)
      // For MVP, we'll use user ID as org ID if no orgs exist
      // TODO: Properly handle organization via Better Auth organization plugin
      organizationId = user.id
    }

    // Encrypt the password
    const passwordEncrypted = await encryptPassword(body.password)

    // Create host in database
    const db = await getDb()
    const hostRepo = new ClickhouseHostRepository(db)

    const newHost = await hostRepo.create({
      organizationId,
      name: body.name,
      host: body.host,
      username: body.username,
      passwordEncrypted,
      createdBy: user.id,
    })

    debug('[POST /api/v1/hosts] Host created successfully', {
      requestId,
      hostId: newHost.id,
    })

    // Return created host (without password)
    const response = createSuccessResponse(
      {
        id: newHost.id,
        name: newHost.name,
        host: newHost.host,
        username: newHost.username,
        organizationId: newHost.organizationId,
        isActive: newHost.isActive,
        createdAt: newHost.createdAt,
      },
      {
        queryId: 'host-create',
        rows: 1,
      }
    )

    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Request-ID', requestId)

    return new Response(response.body, {
      status: 201,
      statusText: 'Created',
      headers: newHeaders,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[POST /api/v1/hosts] Error:', err, { requestId })

    const errorResponse = createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT_POST
    )

    const errorHeaders = new Headers(errorResponse.headers)
    errorHeaders.set('X-Request-ID', requestId)

    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: errorHeaders,
    })
  }
}
