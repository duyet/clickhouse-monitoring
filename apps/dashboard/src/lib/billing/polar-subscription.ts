/**
 * Pull a billing owner's live entitlement straight from Polar — the source of
 * truth, independent of the webhook + D1 cache.
 *
 * Why: webhooks can be missed (delivery 5xx, a cold D1, a replayed event) and
 * the D1 row can drift. Reading the owner's CURRENT state from Polar by its
 * `externalId` (= the Clerk user id or org id we stamped on checkout) makes the
 * dashboard always reflect reality. The D1 row becomes a best-effort cache, not
 * the authority.
 *
 * Cancel-grace is native: Polar's customer STATE `activeSubscriptions` only
 * contains subscriptions that still grant access right now — a subscription set
 * to cancel at period end stays here (status `active`, `cancelAtPeriodEnd:true`)
 * until the period actually ends, then drops out. So "cancelled but paid through
 * the cycle" keeps the plan until the cycle ends, with no extra logic.
 */

import type { PlanId } from './plans'

import {
  getPolarClient,
  isBillingConfigured,
  planForProductId,
} from './polar-config'

export interface OwnerSubscription {
  planId: PlanId
  billingPeriod: 'monthly' | 'yearly' | null
  /** Polar status (active | trialing | …). Live by construction here. */
  status: string
  /** Unix seconds the current paid period runs until; access valid until then. */
  currentPeriodEnd: number | null
  /** True when the user cancelled but is still inside the paid period. */
  cancelAtPeriodEnd: boolean
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  max: 2,
  enterprise: 3,
}

function toUnixSeconds(value: Date | string | null | undefined): number | null {
  if (!value) return null
  const ms = value instanceof Date ? value.getTime() : Date.parse(value)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
}

/**
 * The owner's current paid subscription per Polar, or null when they have none
 * (free), Polar is not configured, or the call fails (caller falls back to the
 * D1 cache / free). When several active subscriptions exist, the highest plan
 * wins.
 */
export async function pullOwnerSubscriptionFromPolar(
  externalId: string
): Promise<OwnerSubscription | null> {
  if (!isBillingConfigured()) return null
  try {
    const state = await getPolarClient().customers.getStateExternal({
      externalId,
    })
    const active =
      'activeSubscriptions' in state ? (state.activeSubscriptions ?? []) : []

    let best: OwnerSubscription | null = null
    for (const s of active) {
      const mapped = planForProductId(s.productId)
      if (!mapped) continue
      const candidate: OwnerSubscription = {
        planId: mapped.planId,
        billingPeriod: mapped.period,
        status: s.status,
        currentPeriodEnd: toUnixSeconds(s.currentPeriodEnd),
        cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
      }
      if (
        !best ||
        (PLAN_RANK[candidate.planId] ?? 0) > (PLAN_RANK[best.planId] ?? 0)
      ) {
        best = candidate
      }
    }
    return best
  } catch {
    // 404 ResourceNotFound (no Polar customer for this externalId yet) or a
    // transient API error — treat as "no live subscription"; caller falls back.
    return null
  }
}
