/**
 * Request-level auth guard for `/api/v1/*` routes.
 *
 * Ported from apps/dashboard/middleware.ts (#1397). The Next app ran this in
 * Next middleware; TanStack Start has no `middleware.ts`, so the equivalent
 * runs as a global request middleware registered in `src/start.ts`.
 *
 * Two pieces of the Next middleware are reproduced here:
 *
 *  1. API-key auth (`getApiKeyAuthFailure`) — when `apiKeyAuthEnabled()` is
 *     true, EVERY `/api/v1/*` route requires a valid `chm_` Bearer token and
 *     returns a 401 JSON `{ error: 'API key required' }` (or
 *     `Invalid API key: <reason>`) otherwise. Exempt: `/api/v1/auth/api-key`
 *     (it owns its own secret-based auth in the handler).
 *
 *  2. cloud→dash 301 redirect (`getLegacyHostRedirect`).
 *
 * NOT ported: the Next `clerkMiddleware()` / Clerk-cookie precheck for
 * protected agent routes (`getAgentApiClerkPrecheck`). In this app those routes
 * (`/api/v1/agent`, …) already enforce feature-permission auth in-handler via
 * `authorizeAgentApiRequest` / `authorizeFeatureRequest`, and Clerk runs as a
 * client provider (see __root.tsx) — there is no server-side Clerk middleware
 * to bypass. The route handlers own that decision, identical to Next behavior.
 *
 * `apiKeyAuthEnabled()` and `verifyApiKey()` read `process.env.CHM_API_KEY_SECRET`
 * directly. On Cloudflare Workers the canonical source is the `env` binding, so
 * `bridgeApiKeyEnv(env)` copies the secret onto `process.env` before the check
 * (same bridge pattern as `bridgeClickHouseEnv`).
 */

import {
  apiKeyAuthEnabled,
  getBearerToken,
  verifyApiKey,
} from '@chm/mcp-server/auth'
import { getAuthProvider, isAuthProviderConfigError } from '@/lib/auth/provider'

const API_V1_PREFIX = '/api/v1/'
// Key issuance route has its own secret-based auth in its handler.
const API_KEY_ISSUANCE_PATH = '/api/v1/auth/api-key'

const LEGACY_HOST = 'cloud.chmonitor.dev'
const CANONICAL_HOST = 'dash.chmonitor.dev'

type EnvBindings = Record<string, string | undefined>

/**
 * Copy CHM_API_KEY_SECRET from the Worker `env` binding onto `process.env`
 * so `apiKeyAuthEnabled()` / `verifyApiKey()` (which read process.env) see it.
 * Idempotent; only sets when present on the binding and not already set.
 */
export function bridgeApiKeyEnv(bindings: EnvBindings): void {
  if (typeof process === 'undefined' || !process.env) return
  const value = bindings.CHM_API_KEY_SECRET
  if (value != null && value !== '' && process.env.CHM_API_KEY_SECRET == null) {
    process.env.CHM_API_KEY_SECRET = value
  }
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

/**
 * cloud.chmonitor.dev is a legacy alias of the dashboard. Permanently redirect
 * it to the canonical dash.chmonitor.dev host, preserving path and query.
 *
 * Mirrors `getLegacyHostRedirect` from the Next middleware.
 */
export function getLegacyHostRedirect(request: Request): Response | null {
  const host = request.headers.get('host')
  if (host !== LEGACY_HOST) {
    return null
  }

  const url = new URL(request.url)
  return Response.redirect(
    `https://${CANONICAL_HOST}${url.pathname}${url.search}`,
    301
  )
}

/**
 * Enforce API-key auth for `/api/v1/*` routes when it is enabled.
 *
 * Returns a 401 Response to short-circuit, or `null` to allow the request.
 * Mirrors `getApiKeyAuthFailure` from the Next middleware.
 */
export async function getApiKeyAuthFailure(
  request: Request
): Promise<Response | null> {
  const { pathname } = new URL(request.url)

  if (!pathname.startsWith(API_V1_PREFIX)) {
    return null
  }

  if (!apiKeyAuthEnabled()) return null

  // Key issuance route has its own secret-based auth in the handler.
  if (pathname === API_KEY_ISSUANCE_PATH) {
    return null
  }

  const headerToken = getBearerToken(request.headers.get('authorization'))

  if (!headerToken) {
    return jsonError('API key required', 401)
  }

  const result = await verifyApiKey(headerToken)
  if (!result.valid) {
    return jsonError(`Invalid API key: ${result.reason}`, 401)
  }

  return null
}

/**
 * Resolve the auth-guard response for a request, or `null` to proceed.
 *
 * Order mirrors the Next middleware:
 *  1. legacy host 301 redirect (any path)
 *  2. only `/api/v1/*` requests run the auth checks (others pass through)
 *  3. invalid auth-provider config → 500
 *  4. API-key auth failure → 401
 *
 * `bridgeApiKeyEnv` must be called by the caller (start.ts) before this, so
 * the env binding is visible to process.env-based helpers on Workers.
 */
export async function resolveApiGuard(
  request: Request
): Promise<Response | null> {
  const legacyHostRedirect = getLegacyHostRedirect(request)
  if (legacyHostRedirect) {
    return legacyHostRedirect
  }

  const { pathname } = new URL(request.url)
  if (!pathname.startsWith(API_V1_PREFIX)) {
    return null
  }

  // Surface invalid auth-provider configuration the same way Next did (500),
  // rather than letting a misconfig silently fall through.
  try {
    getAuthProvider()
  } catch (error) {
    if (isAuthProviderConfigError(error)) {
      return jsonError('Invalid auth provider configuration', 500)
    }
    throw error
  }

  return getApiKeyAuthFailure(request)
}
