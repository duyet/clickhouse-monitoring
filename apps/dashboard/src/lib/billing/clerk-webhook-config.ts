/**
 * Clerk webhook — runtime config.
 *
 * CLERK_WEBHOOK_SECRET (secret) — signing secret used to verify inbound
 * webhooks from Clerk's Dashboard → Webhooks configuration. Set it once
 * and never commit the real value (only the commented-out key lives in
 * .env.example). Mirror of getWebhookSecret() in polar-config.ts.
 */

function readEnv(key: string): string | undefined {
  const v = process.env[key]
  return v === undefined || v === '' ? undefined : v
}

export function getClerkWebhookSecret(): string | undefined {
  return readEnv('CLERK_WEBHOOK_SECRET')
}
