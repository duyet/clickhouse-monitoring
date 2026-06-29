/**
 * Resolve a billing owner's effective plan.
 *
 * The free plan is the floor: no subscription row, no D1, or a lapsed/canceled
 * subscription all resolve to free. A paid plan only applies while its status is
 * live and (when present) the current period has not ended — so access cleanly
 * downgrades when a subscription expires without needing a separate cron.
 *
 * Org-scoped billing: paid subscriptions are stored under the Clerk org id (org_*)
 * as the billing-owner id. Use getPlanForOwner(ownerId) / getPlanIdForOwner(ownerId)
 * with the resolved billing owner from resolveBillingOwner(). The legacy
 * getUserPlan(userId) / getUserPlanId(userId) wrappers remain for call-sites that
 * only have a user id (free path — no org).
 */

import type { Plan, PlanId } from './plans'
import type { UserSubscription } from './subscription-store'

import { BILLING_PLANS, getPlan } from './plans'
import { getSubscription } from './subscription-store'

/** Polar statuses that still grant the paid plan. */
const LIVE_STATUSES = new Set(['active', 'trialing'])

export function isSubscriptionLive(
  sub: Pick<UserSubscription, 'status' | 'currentPeriodEnd'>,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  if (!LIVE_STATUSES.has(sub.status)) return false
  if (sub.currentPeriodEnd != null && sub.currentPeriodEnd < nowSeconds) {
    return false
  }
  return true
}

/**
 * Resolve the plan id for a billing owner (user or org), defaulting to free.
 * Pass the id from resolveBillingOwner() — either a Clerk user id or org id.
 */
export async function getPlanIdForOwner(ownerId: string): Promise<PlanId> {
  const sub = await getSubscription(ownerId)
  if (!sub || !isSubscriptionLive(sub)) return 'free'
  return BILLING_PLANS[sub.planId] ? sub.planId : 'free'
}

/**
 * Resolve the Plan object for a billing owner (user or org), defaulting to free.
 */
export async function getPlanForOwner(ownerId: string): Promise<Plan> {
  return getPlan(await getPlanIdForOwner(ownerId))
}

/**
 * The user's current plan id, defaulting to free.
 * Thin wrapper around getPlanIdForOwner — passes userId as the owner key.
 * For routes that have a session context, prefer resolveBillingOwner() +
 * getPlanIdForOwner() to handle org-scoped subscriptions correctly.
 */
export async function getUserPlanId(userId: string): Promise<PlanId> {
  return getPlanIdForOwner(userId)
}

/**
 * The user's current Plan object, defaulting to the free plan.
 * Thin wrapper around getPlanForOwner — passes userId as the owner key.
 * For routes that have a session context, prefer resolveBillingOwner() +
 * getPlanForOwner() to handle org-scoped subscriptions correctly.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  return getPlanForOwner(userId)
}
