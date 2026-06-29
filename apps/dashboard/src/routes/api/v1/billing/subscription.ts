/**
 * GET /api/v1/billing/subscription — the current user's plan + subscription.
 *
 * Returns { planId, status, billingPeriod, currentPeriodEnd }. Always resolves to
 * at least the free plan (see getUserPlanId), so the billing UI can render even
 * before a user has ever subscribed.
 */
import { createFileRoute } from '@tanstack/react-router'

import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { getSubscription } from '@/lib/billing/subscription-store'
import { getUserPlanId } from '@/lib/billing/user-subscription'
import { mapConnectionApiError } from '@/lib/connection-store/api-errors'
import { resolveConnectionUserId } from '@/lib/connection-store/auth'

const ROUTE = { route: '/api/v1/billing/subscription', method: 'GET' }

async function handleGet(): Promise<Response> {
  try {
    const userId = await resolveConnectionUserId()
    const [planId, sub] = await Promise.all([
      getUserPlanId(userId),
      getSubscription(userId),
    ])
    return createSuccessResponse({
      planId,
      status: sub?.status ?? 'none',
      billingPeriod: sub?.billingPeriod ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    })
  } catch (error) {
    return mapConnectionApiError(error, ROUTE)
  }
}

export const Route = createFileRoute('/api/v1/billing/subscription')({
  server: {
    handlers: {
      GET: async () => handleGet(),
    },
  },
})
