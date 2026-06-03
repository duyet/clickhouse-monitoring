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

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [apiAuthMiddleware],
  }
})
