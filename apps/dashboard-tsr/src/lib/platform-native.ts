/**
 * Native `@chm/platform` replacement for the TanStack Start / @cloudflare/vite-plugin
 * worker (aliased to `@chm/platform` in vite.config.ts + tsconfig.json).
 *
 * The upstream `@chm/platform` resolves bindings through
 * `@opennextjs/cloudflare`'s `getCloudflareContext()`, an OpenNext-only API that does
 * not exist in a TanStack Start worker (and `@opennextjs/cloudflare` is not a
 * dependency here). This shim instead reads bindings straight from the
 * `cloudflare:workers` env — which is the real Worker env on workerd and a
 * `process.env` shim on the Node/Docker build target. D1 access therefore works on
 * Cloudflare and degrades to `null` everywhere else (the conversation store falls
 * back to its memory/client adapter when the binding is absent).
 *
 * Re-exports all shared feature-permission types and helpers from the real
 * `@chm/platform` package so that downstream code can import from `@chm/platform`
 * and get both the native bindings adapter and the shared modules.
 */
// Lazy import — `cloudflare:workers` only exists in the workerd runtime.
// Top-level import crashes tests and Node dev server.
let _env: Record<string, unknown> | undefined
function getEnv(): Record<string, unknown> | undefined {
  if (_env !== undefined) return _env
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('cloudflare:workers')
    _env = mod.env as Record<string, unknown> | undefined
  } catch {
    _env = undefined
  }
  return _env
}

// ---------------------------------------------------------------------------
// Platform bindings (native worker adapter)
// ---------------------------------------------------------------------------

export interface PlatformBindings {
  getD1Database(bindingName: string): D1Database | null
}

export function getPlatformBindings(): PlatformBindings {
  return {
    getD1Database(bindingName: string): D1Database | null {
      const binding = getEnv()?.[bindingName]
      // A real D1Database is an object on workerd; on the Node shim the value is
      // absent or a plain string, so we return null and let callers degrade.
      return binding && typeof binding === 'object'
        ? (binding as unknown as D1Database)
        : null
    },
  }
}

// ---------------------------------------------------------------------------
// Shared feature-permission module (pass-through from the real @chm/platform)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared feature-permission module (pass-through from the real @chm/platform)
// ---------------------------------------------------------------------------

export type {
  FeatureAccess,
  FeatureId,
  FeatureOverride,
  FeatureOverrides,
  FeaturePermission,
  FeatureState,
  Principal,
  PublicFeaturePermissionConfig,
  ResolvedFeatureStates,
} from '../../../../packages/platform/src/feature-permissions/types'

export {
  parseBoolean,
  parseFeaturesConfig,
  parseLegacyFeatureOverrides,
  splitEnvList,
} from '../../../../packages/platform/src/feature-permissions/features-config'
export {
  DEFAULT_FEATURE_ACCESS,
  DEFAULT_FEATURE_STATE,
  getDefaultFeatureState,
  getResolvedFeatureStates,
  isFeatureAccess,
  isFeatureAllowed,
  isFeatureId,
  mergeFeatureOverrides,
  normalizeFeatureAccess,
  normalizeFeatureId,
  resolveFeatureState,
} from '../../../../packages/platform/src/feature-permissions/shared'
export {
  FEATURE_ACCESS_VALUES,
  FEATURE_IDS,
} from '../../../../packages/platform/src/feature-permissions/types'
