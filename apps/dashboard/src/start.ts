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
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import {
  bridgeApiKeyEnv,
  bridgePublicReadEnv,
  resolveApiGuard,
} from '@/lib/auth/api-guard'
import { isClerkAuthProvider } from '@/lib/auth/provider'
import { withSecurityHeaders } from '@/lib/security-headers'

// Returning a Response from a request middleware short-circuits the chain and
// sends that Response without running the route handler (same mechanism the
// built-in CSRF middleware uses). Calling `next()` proceeds normally.
const apiAuthMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    // Bridge the Worker env secret onto process.env so apiKeyAuthEnabled() /
    // verifyApiKey() (which read process.env.CHM_API_KEY_SECRET) can see it.
    bridgeApiKeyEnv(env as Record<string, string | undefined>)
    bridgePublicReadEnv(env as Record<string, string | undefined>)

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

// ---------------------------------------------------------------------------
// Clerk middleware
// ---------------------------------------------------------------------------
// `auth()` from `@clerk/tanstack-react-start/server` reads the authenticated
// session from `getGlobalStartContext().auth`, which is ONLY populated by
// `clerkMiddleware()`. Without it, every server-side `auth()` call throws
// `clerkMiddlewareNotConfigured` (silently caught by try/catch in
// feature-permission checks), causing all authenticated endpoints to return
// 401 even when the user has a valid Clerk session cookie.
//
// The middleware must run before apiAuthMiddleware so the auth context is
// available to downstream guards and route handlers.
//
// GUARD: `clerkMiddleware()` calls `clerkClient()` which requires
// `CLERK_SECRET_KEY`. This key is only available at runtime (Cloudflare Worker
// secret), NOT during CI builds or prerender. Without the guard, the build
// fails with "Clerk: no secret key provided" during static generation.

/** True when the Clerk secret key is available (runtime only, not CI build). */
function hasClerkSecretKey(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY || import.meta.env.CLERK_SECRET_KEY
  )
}

export const startInstance = createStart(() => {
  // Order matters: security-headers is first (outermost) so it wraps the
  // entire chain and patches the response on the way out.
  const middleware = [securityHeadersMiddleware]

  if (isClerkAuthProvider() && hasClerkSecretKey()) {
    middleware.push(clerkMiddleware())
  }

  middleware.push(apiAuthMiddleware)

  return { requestMiddleware: middleware }
})
