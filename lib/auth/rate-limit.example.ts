/**
 * Example: Using rate limiting in API routes
 *
 * This file demonstrates how to apply rate limiting to auth endpoints
 */

import { withRateLimit } from './rate-limit'

/**
 * Example: Apply rate limiting to an API route
 *
 * Usage in app/api/auth/[...all]/route.ts or similar:
 */
export async function POST(request: Request) {
  // Extract client IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Check rate limit
  const rateLimitResponse = withRateLimit(ip)
  if (rateLimitResponse) {
    // Rate limit exceeded, return 429 response
    return rateLimitResponse
  }

  // Continue with normal request handling
  // ... your auth logic here
  return new Response('OK')
}

/**
 * Example: Manual rate limit check with custom response
 */
import { checkRateLimit, getRateLimitHeaders } from './rate-limit'

export async function handleLogin(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

  const result = checkRateLimit(ip)
  const headers = getRateLimitHeaders(result)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many login attempts',
        retryAfter: headers['Retry-After'],
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    )
  }

  // Add rate limit headers to successful responses too
  // ... your login logic here
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}
