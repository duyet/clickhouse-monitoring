/**
 * App config endpoint
 * GET /api/v1/config
 *
 * Returns the public feature-permission config the client consumes:
 *   { authProvider, principal, features, resolved }
 *
 * WORKERD CONSTRAINTS (intentional differences from the Next app):
 * - No CHM_CONFIG_FILE loading: the dashboard's loadConfigFile() uses
 *   `node:fs/promises` + js-yaml/smol-toml, which are not wired in this app.
 *   File-based overrides are therefore NOT read here — env-driven config only.
 * - Principal is ALWAYS 'anonymous': resolving an authenticated principal
 *   requires Clerk's server `auth()` from '@clerk/nextjs/server', which is not
 *   available in workerd and must not be imported (FAIL-LOUD rule). Per-request
 *   auth is centralized in middleware. The client treats principal as a hint;
 *   the server still enforces auth on protected routes.
 * - authProvider is read from the runtime CHM_AUTH_PROVIDER worker var, falling
 *   back to the build-time import.meta.env.VITE_AUTH_PROVIDER constant.
 *
 * Response SHAPE matches PublicFeaturePermissionConfig.
 */

import { createFileRoute } from '@tanstack/react-router'

import type { PublicFeaturePermissionConfig } from '@/lib/feature-permissions/types'

import { env } from 'cloudflare:workers'
import {
  getResolvedFeatureStates,
  mergeFeatureOverrides,
  parseFeaturesConfig,
  parseLegacyFeatureOverrides,
} from '@chm/platform'
import { parseAuthProvider } from '@/lib/auth/provider'

// ---------------------------------------------------------------------------
// Env access (Worker binding first, then process.env).
// ---------------------------------------------------------------------------

type EnvBindings = Record<string, string | undefined>

function readEnv(key: string): string | undefined {
  const bindings = env as EnvBindings
  const fromBinding = bindings[key]
  if (fromBinding !== undefined && fromBinding !== '') return fromBinding
  if (typeof process !== 'undefined' && process.env) {
    const fromProcess = process.env[key]
    if (fromProcess !== undefined && fromProcess !== '') return fromProcess
  }
  return undefined
}

/**
 * Build feature overrides from env vars.
 * Uses shared parsers from @chm/platform:
 *   - parseFeaturesConfig:  CHM_FEATURES compact format (v0.3)
 *   - parseLegacyFeatureOverrides: CHM_DISABLED_FEATURES, CHM_AUTH_REQUIRED_FEATURES,
 *     and CHM_FEATURE_<ID>_* per-feature vars (backward compat)
 */
function parseEnvFeatureOverrides() {
  const primary = parseFeaturesConfig(readEnv('CHM_FEATURES'))
  const legacy = parseLegacyFeatureOverrides(readEnv)
  return mergeFeatureOverrides(primary, legacy)
}

function getPublicFeaturePermissionConfig(): PublicFeaturePermissionConfig {
  const authProvider = parseAuthProvider(
    readEnv('CHM_AUTH_PROVIDER') ??
      import.meta.env.VITE_AUTH_PROVIDER ??
      readEnv('NEXT_PUBLIC_AUTH_PROVIDER')
  )

  const features = parseEnvFeatureOverrides()
  const resolved = getResolvedFeatureStates({ features })

  return {
    authProvider,
    // WORKERD: no server-side Clerk auth() here → always anonymous.
    // Protected routes are enforced by middleware regardless.
    principal: 'anonymous',
    features,
    resolved,
  }
}

export const Route = createFileRoute('/api/v1/config')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const config = getPublicFeaturePermissionConfig()
          // Env-derived feature flags, principal always anonymous — cache at edge.
          return Response.json(config, {
            headers: {
              'Cache-Control':
                'public, s-maxage=300, stale-while-revalidate=300',
            },
          })
        } catch (err) {
          return Response.json(
            {
              error: {
                code: 'INVALID_FEATURE_PERMISSION_CONFIG',
                message:
                  err instanceof Error
                    ? err.message
                    : 'Invalid feature permission config',
              },
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
