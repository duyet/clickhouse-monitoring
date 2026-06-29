/**
 * POST /api/v1/webhooks/polar — Polar webhook receiver.
 *
 * Verifies the signature over the RAW body (validateEvent base64-encodes the
 * secret internally), then upserts the user's subscription row keyed by
 * `customer.externalId` (the Clerk userId we set as externalCustomerId at
 * checkout). getUserPlan reads that row; access downgrades to free when a
 * subscription is canceled/expired.
 *
 * Unauthenticated by design — the signature IS the auth. Always 2xx on a valid
 * (even if ignored) event so Polar doesn't retry; 400 only on a bad signature.
 */
import { createFileRoute } from '@tanstack/react-router'

import { error as logError, log as logInfo } from '@chm/logger'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { getWebhookSecret, planForProductId } from '@/lib/billing/polar-config'
import { upsertSubscription } from '@/lib/billing/subscription-store'

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

async function applySubscription(data: PolarSubscriptionData): Promise<void> {
  const userId = data.customer?.externalId
  if (!userId) {
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
  await upsertSubscription({
    userId,
    planId: mapped.planId,
    billingPeriod: mapped.period,
    status: data.status,
    polarSubscriptionId: data.id,
    polarCustomerId: data.customerId,
    currentPeriodEnd: toUnixSeconds(data.currentPeriodEnd),
  })
  logInfo('[polar-webhook] applied subscription', {
    userId,
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
