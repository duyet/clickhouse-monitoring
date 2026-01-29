/**
 * Invitations API endpoint
 * GET /api/v1/invitations - List pending invitations for current org
 * POST /api/v1/invitations - Create new invitation link
 * DELETE /api/v1/invitations/:id - Revoke invitation (via query param)
 *
 * Leverages Better Auth organization plugin invitation system
 */

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { debug, error, generateRequestId } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_GET = { route: '/api/v1/invitations', method: 'GET' }
const ROUTE_CONTEXT_POST = { route: '/api/v1/invitations', method: 'POST' }
const ROUTE_CONTEXT_DELETE = { route: '/api/v1/invitations', method: 'DELETE' }

/**
 * Invitation response type
 */
interface InvitationInfo {
  id: string
  email: string
  role: string
  organizationId: string
  inviterId: string
  status: string
  expiresAt: Date
  createdAt: Date
}

/**
 * Handle GET requests to list pending invitations
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[GET /api/v1/invitations] Fetching pending invitations', { requestId })

  try {
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
          message: 'Authentication required',
          details: {
            hint: 'Please sign in to view invitations',
          },
        },
        401,
        ROUTE_CONTEXT_GET
      )
    }

    // Get organization ID from query params
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId')

    if (!organizationId) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Organization ID required',
          details: {
            hint: 'Provide organizationId query parameter',
          },
        },
        400,
        ROUTE_CONTEXT_GET
      )
    }

    // Get invitations via Better Auth API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invitationsResponse = (await auth.api.listInvitations({
      query: { organizationId },
      headers: request.headers,
    })) as any

    // Handle response format (may be array or response wrapper)
    const invitationsList = Array.isArray(invitationsResponse)
      ? invitationsResponse
      : invitationsResponse?.response || invitationsResponse?.data || []

    const invitations: InvitationInfo[] = invitationsList.map(
      (inv: {
        id: string
        email: string
        role: string
        organizationId: string
        inviterId: string
        status: string
        expiresAt: Date
        createdAt: Date
      }) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        organizationId: inv.organizationId,
        inviterId: inv.inviterId,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })
    )

    debug('[GET /api/v1/invitations] Found invitations', {
      requestId,
      count: invitations.length,
    })

    const response = createSuccessResponse(invitations, {
      queryId: 'invitations-list',
      rows: invitations.length,
    })

    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Request-ID', requestId)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[GET /api/v1/invitations] Error:', err, { requestId })

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
 * Request body for creating a new invitation
 * Note: Better Auth uses 'owner' | 'admin' | 'member' roles
 * We map 'viewer' to 'member' with limited permissions at app level
 */
interface CreateInvitationRequest {
  organizationId: string
  email: string
  role: 'admin' | 'member'
}

/**
 * Handle POST requests to create new invitation
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[POST /api/v1/invitations] Creating new invitation', { requestId })

  try {
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
          message: 'Authentication required',
          details: {
            hint: 'Please sign in to create invitations',
          },
        },
        401,
        ROUTE_CONTEXT_POST
      )
    }

    // Parse request body
    const body = (await request.json()) as CreateInvitationRequest

    // Validate required fields
    if (!body.organizationId || !body.email || !body.role) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required fields',
          details: {
            required: ['organizationId', 'email', 'role'],
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Validate role (Better Auth supports owner/admin/member)
    const validRoles = ['admin', 'member'] as const
    if (!validRoles.includes(body.role)) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invalid role',
          details: {
            validRoles: [...validRoles],
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Create invitation via Better Auth API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invitationResponse = (await auth.api.createInvitation({
      body: {
        organizationId: body.organizationId,
        email: body.email,
        role: body.role as 'admin' | 'member',
      },
      headers: request.headers,
    })) as any

    // Handle response format
    const invitation = invitationResponse?.response || invitationResponse

    if (!invitation || !invitation.id) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: 'Failed to create invitation',
          details: {
            hint: 'The invitation could not be created. Check permissions.',
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    debug('[POST /api/v1/invitations] Invitation created', {
      requestId,
      invitationId: invitation.id,
    })

    // Generate invite link (copy-link approach)
    const baseUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000'
    const inviteLink = `${baseUrl}/auth/invite/${invitation.id}`

    const response = createSuccessResponse(
      {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviteLink, // Link user can copy and share
      },
      {
        queryId: 'invitation-create',
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

    error('[POST /api/v1/invitations] Error:', err, { requestId })

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

/**
 * Handle DELETE requests to revoke invitation
 */
export async function DELETE(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[DELETE /api/v1/invitations] Revoking invitation', { requestId })

  try {
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
          message: 'Authentication required',
          details: {
            hint: 'Please sign in to revoke invitations',
          },
        },
        401,
        ROUTE_CONTEXT_DELETE
      )
    }

    // Get invitation ID from query params
    const url = new URL(request.url)
    const invitationId = url.searchParams.get('id')

    if (!invitationId) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invitation ID required',
          details: {
            hint: 'Provide id query parameter',
          },
        },
        400,
        ROUTE_CONTEXT_DELETE
      )
    }

    // Cancel invitation via Better Auth API
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: request.headers,
    })

    debug('[DELETE /api/v1/invitations] Invitation revoked', {
      requestId,
      invitationId,
    })

    const response = createSuccessResponse(
      {
        success: true,
        message: 'Invitation revoked successfully',
      },
      {
        queryId: 'invitation-revoke',
        rows: 1,
      }
    )

    const newHeaders = new Headers(response.headers)
    newHeaders.set('X-Request-ID', requestId)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[DELETE /api/v1/invitations] Error:', err, { requestId })

    const errorResponse = createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT_DELETE
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
