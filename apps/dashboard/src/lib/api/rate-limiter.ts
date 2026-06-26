/**
 * Workers-compatible in-memory token bucket rate limiter.
 *
 * Design:
 * - Token bucket per (key, route) pair; state lives in-process (per-isolate).
 *   Cloudflare Workers isolates are short-lived, so this is a best-effort
 *   first pass. No Durable Objects required.
 * - Limits are env-configurable:
 *     RATE_LIMIT_AGENT_PER_MIN  (default 10)  — POST /api/v1/agent per identity
 *     RATE_LIMIT_API_PER_MIN    (default 100) — GET  data routes per IP
 * - Returns { allowed, retryAfterSec } so callers can build the 429 response.
 * - Safe for Workers: no Node-only APIs (no `process.hrtime`, no node timers).
 */

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the bucket refills enough for one more token. */
  retryAfterSec: number
  /** Remaining tokens in the bucket (informational). */
  remaining: number
}

interface Bucket {
  tokens: number
  lastRefillMs: number
}

/** Shared in-memory store. Lives for the lifetime of the isolate. */
const buckets = new Map<string, Bucket>()

/**
 * Read a positive-integer env var; fall back to `defaultValue`.
 * Checking process.env is correct here — bridgeClickHouseEnv() copies Worker
 * bindings onto process.env before any API handler runs, so env vars are
 * available. We guard `typeof process !== 'undefined'` to be Workers-safe.
 */
function readIntEnv(key: string, defaultValue: number): number {
  if (typeof process === 'undefined') return defaultValue
  const raw = process.env[key]
  if (!raw) return defaultValue
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
}

/**
 * Check (and consume) one token from a token-bucket keyed by `bucketKey`.
 *
 * @param bucketKey  - Unique identifier (e.g. `agent:user:clerk_abc123`)
 * @param limitPerMin - Maximum requests allowed per 60-second window
 */
export function checkRateLimit(
  bucketKey: string,
  limitPerMin: number
): RateLimitResult {
  const nowMs = Date.now()
  const windowMs = 60_000 // 1 minute

  let bucket = buckets.get(bucketKey)
  if (!bucket) {
    bucket = { tokens: limitPerMin, lastRefillMs: nowMs }
    buckets.set(bucketKey, bucket)
  }

  // Refill tokens proportional to elapsed time
  const elapsedMs = nowMs - bucket.lastRefillMs
  if (elapsedMs > 0) {
    const refill = (elapsedMs / windowMs) * limitPerMin
    bucket.tokens = Math.min(limitPerMin, bucket.tokens + refill)
    bucket.lastRefillMs = nowMs
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return {
      allowed: true,
      retryAfterSec: 0,
      remaining: Math.floor(bucket.tokens),
    }
  }

  // Compute how long until bucket has 1 token
  const msNeeded = ((1 - bucket.tokens) / limitPerMin) * windowMs
  const retryAfterSec = Math.ceil(msNeeded / 1000)

  return { allowed: false, retryAfterSec, remaining: 0 }
}

/**
 * Build the 429 response with Retry-After header.
 */
export function rateLimitResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        type: 'rate_limited',
        message: `Too many requests. Retry after ${retryAfterSec} second(s).`,
        retryAfterSec,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  )
}

/**
 * Extract a stable client identity key from a request.
 * Prefers Cloudflare's CF-Connecting-IP, falls back to X-Real-IP,
 * X-Forwarded-For, then "unknown".
 */
export function clientIpKey(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    ((request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
      'unknown')
  )
}

/**
 * Rate limit config resolved from env.
 * Lazily read so bridgeClickHouseEnv() has already run by the time it's used.
 */
export function getAgentRateLimitPerMin(): number {
  return readIntEnv('RATE_LIMIT_AGENT_PER_MIN', 10)
}

export function getApiRateLimitPerMin(): number {
  return readIntEnv('RATE_LIMIT_API_PER_MIN', 100)
}

/**
 * Flush all buckets (for testing only).
 */
export function _resetBucketsForTest(): void {
  buckets.clear()
}
