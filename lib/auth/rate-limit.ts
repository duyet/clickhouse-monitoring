import { LRUCache } from 'lru-cache'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5

// In-memory rate limit cache
const rateLimitCache = new LRUCache<string, RateLimitEntry>({
  max: 10000, // Max 10k unique IPs
  ttl: WINDOW_MS,
})

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitCache.get(ip)

  if (!entry || now > entry.resetAt) {
    // New window
    const newEntry = { count: 1, resetAt: now + WINDOW_MS }
    rateLimitCache.set(ip, newEntry)
    return {
      success: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: newEntry.resetAt,
    }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  rateLimitCache.set(ip, entry)
  return {
    success: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  }
}

export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.success
      ? {}
      : {
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
        }),
  }
}

// Middleware helper for API routes
export function withRateLimit(ip: string): Response | null {
  const result = checkRateLimit(ip)
  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    })
  }
  return null
}
