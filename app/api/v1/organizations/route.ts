/**
 * Organizations API endpoint
 * GET /api/v1/organizations - List user's organizations
 * POST /api/v1/organizations - Create new organization
 *
 * Leverages Better Auth organization plugin for multi-tenant support
 */

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { debug, error, generateRequestId } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_GET = { route: '/api/v1/organizations', method: 'GET' }
const ROUTE_CONTEXT_POST = { route: '/api/v1/organizations', method: 'POST' }

/**
 * Organization response type
 */
interface OrganizationInfo {
  id: string
  name: string
  slug: string
  logo?: string | null
  createdAt: Date
  metadata?: Record<string, unknown>
}

/**
 * Handle GET requests to list user's organizations
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[GET /api/v1/organizations] Fetching user organizations', {
    requestId,
  })

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
            hint: 'Please sign in to view organizations',
          },
        },
        401,
        ROUTE_CONTEXT_GET
      )
    }

    // Get user's organizations via Better Auth API
    const orgsResponse = await auth.api.listOrganizations({
      headers: request.headers,
    })

    // Transform to our API format
    const organizations: OrganizationInfo[] = (orgsResponse || []).map(
      (org: {
        id: string
        name: string
        slug: string
        logo?: string | null
        createdAt: Date
        metadata?: string | null
      }) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        createdAt: org.createdAt,
        metadata: org.metadata ? JSON.parse(org.metadata) : undefined,
      })
    )

    debug('[GET /api/v1/organizations] Found organizations', {
      requestId,
      count: organizations.length,
    })

    const response = createSuccessResponse(organizations, {
      queryId: 'organizations-list',
      rows: organizations.length,
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

    error('[GET /api/v1/organizations] Error:', err, { requestId })

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
 * Request body for creating a new organization
 */
interface CreateOrganizationRequest {
  name: string
  slug: string
  logo?: string
}

/**
 * Handle POST requests to create new organization
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId()
  debug('[POST /api/v1/organizations] Creating new organization', { requestId })

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
            hint: 'Please sign in to create organizations',
          },
        },
        401,
        ROUTE_CONTEXT_POST
      )
    }

    // Parse request body
    const body = (await request.json()) as CreateOrganizationRequest

    // Validate required fields
    if (!body.name || !body.slug) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required fields',
          details: {
            required: ['name', 'slug'],
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Validate slug format (3-32 chars, lowercase alphanumeric + hyphens)
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/
    if (!slugRegex.test(body.slug)) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invalid slug format',
          details: {
            hint: 'Slug must be 3-32 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.',
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    // Create organization via Better Auth API
    const newOrg = await auth.api.createOrganization({
      body: {
        name: body.name,
        slug: body.slug,
        logo: body.logo,
      },
      headers: request.headers,
    })

    if (!newOrg) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: 'Failed to create organization',
          details: {
            hint: 'The organization could not be created. The slug might already be taken.',
          },
        },
        400,
        ROUTE_CONTEXT_POST
      )
    }

    debug('[POST /api/v1/organizations] Organization created', {
      requestId,
      orgId: newOrg.id,
      slug: newOrg.slug,
    })

    const response = createSuccessResponse(
      {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        logo: newOrg.logo,
        createdAt: newOrg.createdAt,
      },
      {
        queryId: 'organization-create',
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

    error('[POST /api/v1/organizations] Error:', err, { requestId })

    // Check for duplicate slug error
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Organization slug already exists',
          details: {
            hint: 'Please choose a different slug',
          },
        },
        409,
        ROUTE_CONTEXT_POST
      )
    }

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
