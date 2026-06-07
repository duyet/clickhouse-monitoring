/**
 * Server-side feature-permission helpers for TanStack Start / Cloudflare Workers.
 *
 * Ported from apps/dashboard/lib/feature-permissions/server.ts with these
 * intentional differences:
 *
 * - No CHM_CONFIG_FILE loading: `node:fs/promises` is not available in workerd.
 *   All config comes from env vars only.
 * - Clerk `auth()` is imported dynamically and guarded by isClerkAuthProvider()
 *   so the symbol is never touched when Clerk is disabled. Uses
 *   `@clerk/tanstack-react-start/server` (not `@clerk/nextjs/server`).
 * - `auth()` takes no arguments in @clerk/tanstack-react-start@1.3.2
 *   (GetAuthFnNoRequest). The `request` parameter is accepted for API
 *   compatibility with callers but is not forwarded.
 * - Worker env bindings take precedence over process.env via `readEnv()`.
 */

import type { FeatureOverrides, FeaturePermission } from './types'

import { resolveFeatureState } from './shared'
import { env } from 'cloudflare:workers'
import {
  mergeFeatureOverrides,
  parseFeaturesConfig,
  parseLegacyFeatureOverrides,
} from '@chm/platform'
import { isValidAgentApiBearerToken } from '@/lib/auth/agent-api-token'
import { parseAuthProvider } from '@/lib/auth/provider'

// ---------------------------------------------------------------------------
// Env access: Cloudflare binding first, then process.env.
// ---------------------------------------------------------------------------

type EnvBindings = Record<string, string | undefined>

function readEnv(key: string): string | undefined {
  try {
    const bindings = env as EnvBindings
    const fromBinding = bindings[key]
    if (fromBinding !== undefined && fromBinding !== '') return fromBinding
  } catch {
    // cloudflare:workers env not available (e.g. Node dev server)
  }
  if (typeof process !== 'undefined' && process.env) {
    const fromProcess = process.env[key]
    if (fromProcess !== undefined && fromProcess !== '') return fromProcess
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Config resolution (env-only; no file loading).
// Uses shared parsers from @chm/platform:
//   - parseFeaturesConfig:  CHM_FEATURES compact format (v0.3)
//   - parseLegacyFeatureOverrides: CHM_DISABLED_FEATURES, CHM_AUTH_REQUIRED_FEATURES,
//     and CHM_FEATURE_<ID>_* per-feature vars (backward compat)
// ---------------------------------------------------------------------------

function parseEnvFeatureOverrides(): FeatureOverrides {
  // v0.3 compact format takes priority
  const primary = parseFeaturesConfig(readEnv('CHM_FEATURES'))
  // Legacy vars overlay on top
  const legacy = parseLegacyFeatureOverrides(readEnv)
  return mergeFeatureOverrides(primary, legacy)
}

interface AppConfig {
  authProvider: ReturnType<typeof parseAuthProvider>
  features: FeatureOverrides
}

function getAppConfig(): AppConfig {
  const authProvider = parseAuthProvider(
    readEnv('CHM_AUTH_PROVIDER') ??
      import.meta.env.VITE_AUTH_PROVIDER ??
      readEnv('NEXT_PUBLIC_AUTH_PROVIDER')
  )
  return { authProvider, features: parseEnvFeatureOverrides() }
}

// ---------------------------------------------------------------------------
// Auth check.
// ---------------------------------------------------------------------------

async function isAuthenticatedRequest(
  request: Request,
  config: AppConfig,
  options: { allowAgentBearerToken?: boolean } = {}
): Promise<boolean> {
  if (
    options.allowAgentBearerToken &&
    (await isValidAgentApiBearerToken(request))
  ) {
    return true
  }

  if (config.authProvider !== 'clerk') return false

  try {
    // auth() in @clerk/tanstack-react-start@1.3.2 is no-request (GetAuthFnNoRequest).
    const { auth } = await import('@clerk/tanstack-react-start/server')
    const authResult = await auth()
    return Boolean(authResult?.userId)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------------

function jsonFeatureError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

export async function authorizeFeatureRequest(
  permission: FeaturePermission | undefined,
  request: Request,
  options: { allowAgentBearerToken?: boolean } = {}
): Promise<Response | null> {
  if (!permission) return null

  const config = getAppConfig()

  const state = resolveFeatureState(permission, config)
  if (!state.enabled) {
    return jsonFeatureError(
      404,
      'FEATURE_DISABLED',
      `Feature "${permission.feature}" is disabled.`
    )
  }

  if (state.access === 'public') return null

  if (await isAuthenticatedRequest(request, config, options)) return null

  return jsonFeatureError(
    401,
    'AUTHENTICATION_REQUIRED',
    `Feature "${permission.feature}" requires authentication.`,
    { 'www-authenticate': 'Bearer' }
  )
}
