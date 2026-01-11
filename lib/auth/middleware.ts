/**
 * Auth Middleware for API Route Protection
 *
 * Provides utilities for protecting API routes with authentication
 * and role-based access control (RBAC).
 *
 * Note: This is not Next.js middleware (which runs at the edge).
 * These are helper functions for use within API route handlers.
 */

import type { NextRequest } from 'next/server'

import { auth } from './better-auth'
import { isAuthEnabled } from './config'
import {
  getRoleHierarchy,
  hasPermission,
  type Permission,
  type Role,
} from './permissions'
import { NextResponse } from 'next/server'

/**
 * Auth context returned after authentication check
 */
export interface AuthContext {
  isAuthenticated: boolean
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  session?: {
    id: string
    userId: string
    expiresAt: Date
  }
  role: Role
  organizationId?: string
}

/**
 * Options for the withAuth middleware
 */
export interface WithAuthOptions {
  required?: boolean
  permission?: Permission
  minRole?: Role
}

const GUEST_CONTEXT: AuthContext = {
  isAuthenticated: false,
  role: 'guest',
}

/**
 * Gets the auth context from a request
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext> {
  if (!isAuthEnabled()) {
    return GUEST_CONTEXT
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return GUEST_CONTEXT
    }

    const orgId =
      request.headers.get('x-organization-id') ||
      request.nextUrl.searchParams.get('org') ||
      undefined

    let role: Role = 'member'

    if (orgId) {
      try {
        const memberResponse = await auth.api.getFullOrganization({
          headers: request.headers,
          query: { organizationId: orgId },
        })

        if (memberResponse) {
          const member = (memberResponse as any).members?.find(
            (m: any) => m.userId === session.user.id
          )
          if (member) {
            role = member.role as Role
          }
        }
      } catch {
        role = 'member'
      }
    }

    return {
      isAuthenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
      session: {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
      },
      role,
      organizationId: orgId,
    }
  } catch (error) {
    console.error('Auth context error:', error)
    return GUEST_CONTEXT
  }
}

/**
 * Higher-order function that wraps an API route handler with auth protection
 */
export function withAuth<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  handler: (
    request: NextRequest,
    context: { params: Promise<T> },
    authContext: AuthContext
  ) => Promise<NextResponse>,
  options: WithAuthOptions = {}
) {
  const { required = true, permission, minRole } = options

  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const authContext = await getAuthContext(request)

    if (required && !authContext.isAuthenticated) {
      return NextResponse.json(
        { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    if (permission && !hasPermission(authContext.role, permission)) {
      return NextResponse.json(
        {
          error: {
            message: 'You do not have permission to perform this action',
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      )
    }

    if (
      minRole &&
      getRoleHierarchy(authContext.role) < getRoleHierarchy(minRole)
    ) {
      return NextResponse.json(
        {
          error: {
            message: 'Insufficient role permissions',
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      )
    }

    return handler(request, context, authContext)
  }
}

/**
 * Checks if the current request should be rate limited
 */
export function shouldRateLimit(request: NextRequest): boolean {
  return request.nextUrl.pathname.startsWith('/api/auth/')
}

/**
 * Returns a 404 response for unauthorized host access
 */
export function notFoundResponse(): NextResponse {
  return NextResponse.json(
    { error: { message: 'Not found', code: 'NOT_FOUND' } },
    { status: 404 }
  )
}

/**
 * Returns a 429 response for rate limiting
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
