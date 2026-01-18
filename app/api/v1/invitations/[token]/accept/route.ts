/**
 * Invitation Accept API Route
 *
 * POST /api/v1/invitations/:token/accept - Accept an invitation
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/better-auth'
import { isAuthEnabled } from '@/lib/auth/config'

/**
 * POST - Accept an invitation
 *
 * Requires authentication. The authenticated user will join the organization
 * specified in the invitation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  // Check if auth is enabled
  if (!isAuthEnabled()) {
    return NextResponse.json(
      {
        error: {
          message: 'Authentication is not enabled',
          code: 'AUTH_DISABLED',
        },
      },
      { status: 400 }
    )
  }

  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Get the invitation token
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        {
          error: {
            message: 'Invitation token is required',
            code: 'BAD_REQUEST',
          },
        },
        { status: 400 }
      )
    }

    // Accept the invitation using Better Auth
    const response = await auth.api.acceptInvitation({
      body: {
        invitationId: token,
      },
      headers: request.headers,
    })

    // Handle response - Better Auth returns the membership on success
    if (response) {
      return NextResponse.json({
        data: {
          success: true,
          message: 'Successfully joined the organization',
          membership: response,
        },
      })
    }

    return NextResponse.json(
      {
        error: {
          message: 'Failed to accept invitation',
          code: 'ACCEPT_FAILED',
        },
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Accept invitation error:', error)

    // Handle specific error types
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('expired')
    ) {
      return NextResponse.json(
        {
          error: {
            message: 'Invitation not found or has expired',
            code: 'INVITATION_INVALID',
          },
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('already a member')) {
      return NextResponse.json(
        {
          error: {
            message: 'You are already a member of this organization',
            code: 'ALREADY_MEMBER',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: 'Failed to accept invitation',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )
  }
}
