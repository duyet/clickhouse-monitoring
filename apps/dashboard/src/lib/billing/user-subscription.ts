/**
 * Resolve a user's effective billing plan.
 *
 * The free plan is the floor: no subscription row, no D1, or a lapsed/canceled
 * subscription all resolve to free. A paid plan only applies while its status is
 * live and (when present) the current period has not ended — so access cleanly
 * downgrades when a subscription expires without needing a separate cron.
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

/** The user's current plan id, defaulting to free. */
export async function getUserPlanId(userId: string): Promise<PlanId> {
  const sub = await getSubscription(userId)
  if (!sub || !isSubscriptionLive(sub)) return 'free'
  return BILLING_PLANS[sub.planId] ? sub.planId : 'free'
}

/** The user's current Plan object, defaulting to the free plan. */
export async function getUserPlan(userId: string): Promise<Plan> {
  return getPlan(await getUserPlanId(userId))
}
