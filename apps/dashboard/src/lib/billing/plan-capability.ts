/**
 * Server-side plan-capability gate.
 *
 * requirePlanCapability(cap, request) mirrors the style of
 * authorizeFeatureRequest (feature-permissions/server.ts): returns a Response to
 * BLOCK, null to ALLOW.
 *
 * Self-hosted / OSS invariant (hard): when billing context is unavailable —
 * Clerk not configured, no active session, or D1 unreachable — resolveBillingOwner()
 * throws. We catch every resolution error and return null so OSS deployments are
 * NEVER degraded by plan gating. Cloud behaviour is purely additive.
 *
 * Module design: billing-owner and user-subscription are dynamically imported
 * inside requirePlanCapability (matching feature-permissions/server.ts' lazy Clerk
 * import pattern) so that importing THIS module does NOT pull in cloudflare:workers
 * at parse time — this keeps planAllowsCapability unit-testable in Bun.
 */

import type { Plan, PlanCapability } from './plans'

import { hasCapability } from './entitlements'

/**
 * Pure helper: does `plan` grant `cap`? Unit-testable without async / Clerk.
 * Thin alias of hasCapability so callers have a single billing import point.
 */
export function planAllowsCapability(plan: Plan, cap: PlanCapability): boolean {
  return hasCapability(plan, cap)
}

function planCapabilityError(cap: PlanCapability, planId: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'plan_capability_required',
        message: `Your current plan does not include the "${cap}" capability. Upgrade to unlock it.`,
      },
      details: { capability: cap, planId },
    }),
    {
      status: 402,
      headers: { 'content-type': 'application/json' },
    }
  )
}

/**
 * Server-side capability gate. Returns a 402 Response to block, null to allow.
 *
 * Call this after any auth gate (e.g. authorizeFeatureRequest) — it assumes
 * the caller is authenticated when billing context is available.
 *
 * OSS / self-hosted: if Clerk is not configured or the billing context cannot be
 * resolved for any reason, returns null (open). Cloud-only behaviour is additive.
 *
 * @param cap - The {@link PlanCapability} required by the endpoint.
 * @param _request - The incoming Web Request (accepted for API symmetry with
 *   authorizeFeatureRequest; not forwarded to resolveBillingOwner which reads
 *   the Clerk session from context, not from the request object directly).
 */
export async function requirePlanCapability(
  cap: PlanCapability,
  _request: Request
): Promise<Response | null> {
  let plan: Plan
  try {
    // Dynamic imports prevent cloudflare:workers from being pulled in at
    // module parse time, keeping planAllowsCapability unit-testable in Bun.
    const { resolveBillingOwner } = await import('./billing-owner')
    const { getPlanForOwner } = await import('./user-subscription')

    const owner = await resolveBillingOwner()
    plan = await getPlanForOwner(owner.id)
  } catch {
    // Self-hosted, no Clerk key, cold D1, or any other resolution failure.
    // Hard invariant: never gate OSS. Return null → allow.
    return null
  }

  if (planAllowsCapability(plan, cap)) return null

  return planCapabilityError(cap, plan.id)
}
