/**
 * POST /api/v1/webhooks/polar — Polar webhook receiver.
 *
 * Verifies the signature over the RAW body (validateEvent base64-encodes the
 * secret internally), then upserts the subscription row. The billing owner is
 * resolved from `customer.externalId`:
 *
 * - externalId starts with 'user_' (first-time upgrade, no org yet):
 *   1. Check if the user already has a Clerk org membership (idempotency).
 *   2. If not, create a Clerk org lazily and add the user as admin.
 *   3. Upsert the subscription keyed by orgId (owner_type='org').
 *   4. Defensive fallback: if org creation fails, persist under userId so
 *      billing is never lost (owner_type='user').
 *
 * - externalId starts with 'org_' (re-subscription or upgrade on paid account):
 *   Upsert subscription keyed by orgId (owner_type='org') directly.
 *
 * Always 2xx on a valid (even ignored) event so Polar doesn't retry.
 * 400 on bad signature only. 500 on persistence errors (Polar will retry).
 *
 * Unauthenticated by design — the signature IS the auth.
 */
import { createFileRoute } from '@tanstack/react-router'

import { error as logError, log as logInfo } from '@chm/logger'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { getWebhookSecret, planForProductId } from '@/lib/billing/polar-config'
import {
  type OwnerType,
  upsertSubscription,
} from '@/lib/billing/subscription-store'

/** Polar Subscription shape (subset) carried by subscription.* events. */
interface PolarSubscriptionData {
  id: string
  status: string
  recurringInterval?: string | null
  currentPeriodEnd?: Date | string | null
  productId: string
  customerId: string
  customer?: { externalId?: string | null } | null
}

function toUnixSeconds(value: Date | string | null | undefined): number | null {
  if (!value) return null
  const ms = value instanceof Date ? value.getTime() : Date.parse(value)
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
}

/**
 * Attempt to lazily create a Clerk org for a user on their first paid event.
 * Returns the orgId if successful, null on any error (billing is saved under
 * userId as a fallback so payment is never lost).
 *
 * Idempotent: if the user already has an org membership, returns that org's id
 * without creating a duplicate.
 */
async function ensureOrgForUser(userId: string): Promise<string | null> {
  try {
    const { clerkClient } = await import('@clerk/tanstack-react-start/server')
    const client = clerkClient()

    // Check existing memberships first (idempotency guard).
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    })
    if (memberships.data.length > 0) {
      const existingOrgId = memberships.data[0]?.organization?.id
      if (existingOrgId) {
        logInfo('[polar-webhook] user already has org; reusing', {
          userId,
          orgId: existingOrgId,
        })
        return existingOrgId
      }
    }

    // Create a new Clerk org for the buyer.
    const org = await client.organizations.createOrganization({
      name: `${userId} workspace`,
      createdBy: userId,
    })
    logInfo('[polar-webhook] created Clerk org for paid user', {
      userId,
      orgId: org.id,
    })
    return org.id
  } catch (err) {
    // Org creation is best-effort: Clerk orgs may be quota-limited or disabled.
    // Log the error but do not lose the subscription — caller falls back to userId.
    logError(
      '[polar-webhook] org creation failed; falling back to user owner',
      {
        userId,
        err,
      }
    )
    return null
  }
}

async function applySubscription(data: PolarSubscriptionData): Promise<void> {
  const externalId = data.customer?.externalId
  if (!externalId) {
    logInfo('[polar-webhook] subscription without externalId; skipping', {
      subscriptionId: data.id,
    })
    return
  }

  const mapped = planForProductId(data.productId)
  if (!mapped) {
    logInfo('[polar-webhook] unknown product id; skipping', {
      productId: data.productId,
    })
    return
  }

  // planForProductId only returns PaidPlanId ('pro'|'max'); check live status.
  const isPaidPlan = new Set(['active', 'trialing']).has(data.status)

  // Determine billing owner: org or user.
  let ownerId = externalId
  let ownerType: OwnerType = 'user'

  if (externalId.startsWith('org_')) {
    // Already org-scoped (user re-subscribing on an existing paid account).
    ownerType = 'org'
  } else if (externalId.startsWith('user_') && isPaidPlan) {
    // First paid event for this user — lazily create a Clerk org.
    const orgId = await ensureOrgForUser(externalId)
    if (orgId) {
      ownerId = orgId
      ownerType = 'org'
    }
    // If orgId is null, fallback: keep ownerId=userId, ownerType='user'.
    // Billing is preserved under userId; org creation can be retried manually.
  }

  await upsertSubscription({
    userId: ownerId,
    ownerType,
    planId: mapped.planId,
    billingPeriod: mapped.period,
    status: data.status,
    polarSubscriptionId: data.id,
    polarCustomerId: data.customerId,
    currentPeriodEnd: toUnixSeconds(data.currentPeriodEnd),
  })

  logInfo('[polar-webhook] applied subscription', {
    externalId,
    ownerId,
    ownerType,
    planId: mapped.planId,
    status: data.status,
  })
}

async function handlePost(request: Request): Promise<Response> {
  const secret = getWebhookSecret()
  if (!secret) {
    return Response.json(
      { error: 'Billing webhook not configured' },
      { status: 501 }
    )
  }

  const body = await request.text()
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  let event: ReturnType<typeof validateEvent>
  try {
    event = validateEvent(body, headers, secret)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return Response.json({ error: 'Invalid signature' }, { status: 403 })
    }
    logError('[polar-webhook] failed to parse event', err)
    return Response.json({ error: 'Bad request' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
      case 'subscription.canceled':
      case 'subscription.uncanceled':
      case 'subscription.revoked':
      case 'subscription.past_due':
        await applySubscription(event.data as unknown as PolarSubscriptionData)
        break
      default:
        // Acknowledge unhandled events (checkout.*, order.*, etc.) without action.
        break
    }
  } catch (err) {
    // Persistence failed — 500 so Polar retries with backoff.
    logError('[polar-webhook] handler error', err)
    return Response.json({ error: 'Handler error' }, { status: 500 })
  }

  return Response.json({ received: true }, { status: 202 })
}

export const Route = createFileRoute('/api/v1/webhooks/polar')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
