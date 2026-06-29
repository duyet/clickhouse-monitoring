/**
 * POST /api/v1/billing/portal — open the Polar customer portal.
 *
 * Returns: { url } — a customer-session portal URL where the user can manage,
 * upgrade, or cancel their subscription and update payment details. Polar hosts
 * the whole UI; we just mint a session for the current user via externalId.
 */
import { createFileRoute } from '@tanstack/react-router'

import { createErrorResponse as createApiErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { getPolarClient, isBillingConfigured } from '@/lib/billing/polar-config'
import { mapConnectionApiError } from '@/lib/connection-store/api-errors'
import { resolveConnectionUserId } from '@/lib/connection-store/auth'

const ROUTE = { route: '/api/v1/billing/portal', method: 'POST' }

async function handlePost(): Promise<Response> {
  if (!isBillingConfigured()) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: 'Billing is not enabled.',
      },
      501,
      ROUTE
    )
  }

  try {
    const userId = await resolveConnectionUserId()
    const session = await getPolarClient().customerSessions.create({
      externalCustomerId: userId,
    })
    return createSuccessResponse({ url: session.customerPortalUrl })
  } catch (error) {
    return mapConnectionApiError(error, ROUTE)
  }
}

export const Route = createFileRoute('/api/v1/billing/portal')({
  server: {
    handlers: {
      POST: async () => handlePost(),
    },
  },
})
