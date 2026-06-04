/**
 * TanStack Start server configuration.
 *
 * Registers the global request middleware that ports the Next.js
 * `apps/dashboard/middleware.ts` security posture (#1397): API-key auth for
 * `/api/v1/*` routes and the cloud→dash 301 redirect. See
 * `@/lib/auth/api-guard` for the ported logic and the rationale for what is
 * (and is not) reproduced from the Next middleware.
 *
 * The `tanstackStart()` vite plugin auto-discovers this file by convention.
 * `requestMiddleware` runs for EVERY request (server routes, SSR, server
 * functions), so it can return a 401/redirect Response before any `/api/v1/*`
 * handler executes — matching how Next middleware intercepted the request.
 */

import { createMiddleware, createStart } from '@tanstack/react-start'

import { env } from 'cloudflare:workers'
import { bridgeApiKeyEnv, resolveApiGuard } from '@/lib/auth/api-guard'
import { withSecurityHeaders } from '@/lib/security-headers'

// Returning a Response from a request middleware short-circuits the chain and
// sends that Response without running the route handler (same mechanism the
// built-in CSRF middleware uses). Calling `next()` proceeds normally.
const apiAuthMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    // Bridge the Worker env secret onto process.env so apiKeyAuthEnabled() /
    // verifyApiKey() (which read process.env.CHM_API_KEY_SECRET) can see it.
    bridgeApiKeyEnv(env as Record<string, string | undefined>)

    const guardResponse = await resolveApiGuard(request)
    if (guardResponse) {
      return guardResponse
    }

    return next()
  }
)

// ---------------------------------------------------------------------------
// Security response headers
// ---------------------------------------------------------------------------
// Applied to every response (pages, API, static assets). The middleware runs
// AFTER the downstream chain (via `next()`) so it can patch the final
// Response. See `@/lib/security-headers` for the header set and rationale.
// CSP is intentionally omitted — the app loads remote scripts (Clerk,
// analytics) and constructing a strict CSP would require ongoing maintenance
// that outweighs the benefit at this stage.

/**
 * Appends security headers to every response.
 *
 * `next()` returns the accumulated middleware context whose `.response` is
 * the final `Response` produced by the route handler or prerender. We clone
 * it with the extra headers. The middleware MUST come first in the array so
 * it wraps the entire chain (outermost position).
 */
const securityHeadersMiddleware = createMiddleware().server(
  async ({ next }) => {
    const result = await next()

    if (result.response instanceof Response) {
      result.response = withSecurityHeaders(result.response)
    }

    // Return the result (not void) — TanStack Start types a request middleware
    // as returning `RequestServerResult | Response`, and the runtime reads the
    // response from the returned value. Returning the mutated result both
    // type-checks and avoids relying on by-reference ctx mutation.
    return result
  }
)

export const startInstance = createStart(() => {
  return {
    // Order matters: security-headers is first so it wraps the entire chain
    // and patches the response on the way out.
    requestMiddleware: [securityHeadersMiddleware, apiAuthMiddleware],
  }
})
