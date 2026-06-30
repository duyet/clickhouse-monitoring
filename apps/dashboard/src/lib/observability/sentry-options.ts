// Shared, pure helpers for the Sentry integration (client + Cloudflare server).
//
// Sentry is OFF unless a DSN is provided — the OSS default. Self-hosters opt in
// by setting CHM_SENTRY_DSN (→ inlined as VITE_SENTRY_DSN for the browser and
// injected as a Worker [var] for the server). The hosted product sets the DSN
// in apps/dashboard/.env.production. See docs/knowledge/observability-sentry.md.

/** Parse a `tracesSampleRate` string into a [0, 1] number, or fall back. */
export function parseSampleRate(
  raw: string | undefined,
  fallback: number
): number {
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback
  return n
}

/** Common Sentry.init options shared by the browser and Worker SDKs. */
export interface SharedSentryOptions {
  dsn: string
  environment: string
  release: string | undefined
  tracesSampleRate: number
  /** Never attach PII (IP, cookies, request bodies) by default. */
  sendDefaultPii: false
}

/**
 * Builds the option object common to both SDKs. Returns `null` when no DSN is
 * configured, which every caller treats as "Sentry disabled" (no-op).
 */
export function buildSharedSentryOptions(input: {
  dsn: string | undefined
  environment: string | undefined
  release: string | undefined
  tracesSampleRate: string | undefined
}): SharedSentryOptions | null {
  const dsn = input.dsn?.trim()
  if (!dsn) return null
  return {
    dsn,
    environment: input.environment?.trim() || 'development',
    release: input.release?.trim() || undefined,
    tracesSampleRate: parseSampleRate(input.tracesSampleRate, 0.1),
    sendDefaultPii: false,
  }
}
