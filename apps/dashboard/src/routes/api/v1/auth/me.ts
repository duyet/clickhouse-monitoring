/**
 * Current-principal endpoint
 * GET /api/v1/auth/me
 *
 * Returns the identity the active auth provider derives from the request, so
 * the client (sidebar user menu) can show the signed-in user's name, email and
 * avatar instead of the static "Guest" placeholder.
 *
 * This is the only place a rich principal is exposed to the browser: the
 * `/api/v1/config` endpoint always reports `principal: 'anonymous'` (it cannot
 * run per-request auth on workerd). Here we run the provider against the
 * incoming request — under `trusted`/`proxy` the proxy has already attached the
 * identity headers/JWT to THIS request, so the provider can read them.
 *
 * Response: `{ authenticated, provider, principal | null }`. Never cached
 * (identity is per-request). Fails closed: any error → unauthenticated.
 */

import { createFileRoute } from '@tanstack/react-router'

import type { AuthPrincipal } from '@/lib/auth/providers/types'

import { getAuthProvider } from '@/lib/auth/provider'
import { resolveServerAuthProvider } from '@/lib/auth/providers'

interface MeResponse {
  authenticated: boolean
  provider: ReturnType<typeof getAuthProvider>
  principal: AuthPrincipal | null
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const

async function handleGet(request: Request): Promise<Response> {
  let provider: ReturnType<typeof getAuthProvider>
  try {
    provider = getAuthProvider()
  } catch {
    const body: MeResponse = {
      authenticated: false,
      provider: 'none',
      principal: null,
    }
    return Response.json(body, { headers: NO_STORE })
  }

  // `none`: the dashboard is public; there is no principal to report.
  if (provider === 'none') {
    const body: MeResponse = { authenticated: true, provider, principal: null }
    return Response.json(body, { headers: NO_STORE })
  }

  const result =
    await resolveServerAuthProvider(provider).authenticateRequest(request)

  // Prefer the rich principal; fall back to a subject-only principal for
  // providers (clerk/proxy) that authenticate without a full profile.
  const principal: AuthPrincipal | null = result.principal
    ? result.principal
    : result.subject
      ? { subject: result.subject }
      : null

  const body: MeResponse = {
    authenticated: result.authenticated,
    provider,
    principal: result.authenticated ? principal : null,
  }
  return Response.json(body, { headers: NO_STORE })
}

export const Route = createFileRoute('/api/v1/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }) => handleGet(request),
    },
  },
})
