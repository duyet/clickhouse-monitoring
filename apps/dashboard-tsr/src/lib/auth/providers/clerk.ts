import type { AuthResult, ServerAuthProvider } from './types'

/**
 * Clerk session provider — networkless JWT verification straight off the
 * `Request` via `clerkClient().authenticateRequest`. Browser clients send
 * Clerk's `__session` cookie (same-origin, automatic) and may also carry a
 * Clerk token in the Authorization header; both are handled by Clerk.
 *
 * Reads `CLERK_SECRET_KEY` from the runtime env and the publishable key inlined
 * at build time (`VITE_CLERK_PUBLISHABLE_KEY`). When either is absent the
 * provider is unconfigured and returns not-authenticated. Fails closed on any
 * verification error (this also keeps keyless prerender safe).
 *
 * Moved here from the inline `hasValidClerkSession` in `api-guard.ts` (#1437)
 * when auth providers became pluggable.
 */
export class ClerkAuthProvider implements ServerAuthProvider {
  async authenticateRequest(request: Request): Promise<AuthResult> {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
    if (!publishableKey || !process.env.CLERK_SECRET_KEY) {
      return { authenticated: false }
    }

    try {
      const { clerkClient } = await import('@clerk/tanstack-react-start/server')
      const requestState = await clerkClient().authenticateRequest(request, {
        publishableKey,
        authorizedParties: [new URL(request.url).origin],
      })
      return {
        authenticated: requestState.isSignedIn,
        subject: requestState.toAuth?.()?.userId ?? undefined,
      }
    } catch {
      return { authenticated: false }
    }
  }
}
