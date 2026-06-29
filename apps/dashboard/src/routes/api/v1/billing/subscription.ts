/**
 * GET /api/v1/billing/subscription — the current user's plan + subscription.
 *
 * Returns { planId, status, billingPeriod, currentPeriodEnd, owner } where
 * `owner` is { type: 'org'|'user', id: string } — the billing-owner entity
 * so the UI can distinguish org vs personal billing. Plan and subscription data
 * are always keyed by the billing owner, not necessarily the user id.
 *
 * Always resolves to at least the free plan (see getPlanIdForOwner), so the
 * billing UI can render even before a user has ever subscribed.
 */
import { createFileRoute } from '@tanstack/react-router'

import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { resolveBillingOwner } from '@/lib/billing/billing-owner'
import { getSubscription } from '@/lib/billing/subscription-store'
import { getPlanIdForOwner } from '@/lib/billing/user-subscription'
import { mapConnectionApiError } from '@/lib/connection-store/api-errors'

const ROUTE = { route: '/api/v1/billing/subscription', method: 'GET' }

async function handleGet(): Promise<Response> {
  try {
    const owner = await resolveBillingOwner()
    const [planId, sub] = await Promise.all([
      getPlanIdForOwner(owner.id),
      getSubscription(owner.id),
    ])
    return createSuccessResponse({
      planId,
      status: sub?.status ?? 'none',
      billingPeriod: sub?.billingPeriod ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      owner: { type: owner.type, id: owner.id },
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
