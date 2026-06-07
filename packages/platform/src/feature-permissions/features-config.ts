/**
 * CHM_FEATURES config string parser.
 *
 * Parses the compact feature configuration format introduced in v0.3:
 *
 *   CHM_FEATURES=agent:auth,peerdb:off,settings:auth
 *
 * Short aliases:
 *   auth   → access=authenticated
 *   public → access=public
 *   off    → enabled=false
 *   on     → enabled=true
 *
 * Explicit key=value also accepted:
 *   agent:access=authenticated,peerdb:enabled=false
 */

import type { FeatureOverride, FeatureOverrides } from './types'

import {
  mergeFeatureOverrides,
  normalizeFeatureAccess,
  normalizeFeatureId,
} from './shared'

/**
 * Short alias → override mapping for the `value` position of
 * `feature:value` entries (no `=` sign).
 */
const VALUE_ALIASES: Record<string, FeatureOverride> = {
  auth: { access: 'authenticated' },
  public: { access: 'public' },
  off: { enabled: false },
  on: { enabled: true },
}

/**
 * Parse a `CHM_FEATURES` config string into `FeatureOverrides`.
 *
 * @param raw - The raw env var value (e.g. `"agent:auth,peerdb:off"`)
 * @returns Merged feature overrides
 *
 * @example
 * parseFeaturesConfig('agent:auth,peerdb:off')
 * // → { agent: { access: 'authenticated' }, peerdb: { enabled: false } }
 *
 * parseFeaturesConfig('agent:access=authenticated,settings:enabled=false')
 * // → { agent: { access: 'authenticated' }, settings: { enabled: false } }
 */
export function parseFeaturesConfig(raw: string | undefined): FeatureOverrides {
  let overrides: FeatureOverrides = {}
  if (!raw?.trim()) return overrides

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue

    // Split on first ':' to get feature_id:rest
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const rawFeatureId = trimmed.slice(0, colonIdx)
    const rest = trimmed.slice(colonIdx + 1)
    if (!rawFeatureId || !rest) continue

    let featureId: string
    try {
      featureId = normalizeFeatureId(rawFeatureId)
    } catch {
      // Skip invalid feature IDs silently
      continue
    }

    let override: FeatureOverride

    if (rest.includes('=')) {
      // Explicit key=value: agent:access=authenticated
      override = parseExplicitEntry(rest)
    } else {
      // Short alias: agent:auth or agent:public
      override = parseAliasEntry(rest)
    }

    if (Object.keys(override).length > 0) {
      overrides = mergeFeatureOverrides(overrides, { [featureId]: override })
    }
  }

  return overrides
}

/**
 * Parse an explicit `key=value` entry (e.g. `access=authenticated`).
 */
function parseExplicitEntry(rest: string): FeatureOverride {
  const eqIdx = rest.indexOf('=')
  const prop = rest.slice(0, eqIdx).trim()
  const value = rest.slice(eqIdx + 1).trim()

  const override: FeatureOverride = {}

  if (prop === 'enabled') {
    override.enabled = parseBoolean(value)
  } else if (prop === 'access') {
    try {
      override.access = normalizeFeatureAccess(value)
    } catch {
      // Skip invalid access values
    }
  }

  return override
}

/**
 * Parse a short alias entry (e.g. `auth`, `off`, `public`).
 */
function parseAliasEntry(rest: string): FeatureOverride {
  // Check built-in aliases first
  const alias = VALUE_ALIASES[rest.toLowerCase()]
  if (alias) return { ...alias }

  // Fall back to treating it as a boolean for `enabled`
  const bool = parseBoolean(rest)
  if (bool !== undefined) return { enabled: bool }

  return {}
}

/**
 * Parse a boolean string.
 */
export function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return undefined
}

/**
 * Split a comma-separated env var into trimmed, non-empty strings.
 */
export function splitEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Build feature overrides from legacy env vars.
 *
 * This is the backward-compat layer: old vars overlay on top of CHM_FEATURES.
 *
 * @param readEnv - Function that reads an env var by name
 * @returns Feature overrides from legacy vars
 */
export function parseLegacyFeatureOverrides(
  readEnv: (key: string) => string | undefined
): FeatureOverrides {
  let overrides: FeatureOverrides = {}

  // CHM_DISABLED_FEATURES=overview,metrics
  for (const feature of splitEnvList(readEnv('CHM_DISABLED_FEATURES'))) {
    overrides = mergeFeatureOverrides(overrides, {
      [normalizeFeatureId(feature)]: { enabled: false },
    })
  }

  // CHM_AUTH_REQUIRED_FEATURES=agent,settings
  for (const feature of splitEnvList(readEnv('CHM_AUTH_REQUIRED_FEATURES'))) {
    overrides = mergeFeatureOverrides(overrides, {
      [normalizeFeatureId(feature)]: { access: 'authenticated' },
    })
  }

  // CHM_FEATURE_<ID>_ACCESS and CHM_FEATURE_<ID>_ENABLED
  for (const feature of [
    'overview',
    'agent',
    'insights',
    'health',
    'queries',
    'tables',
    'metrics',
    'dashboard',
    'security',
    'logs',
    'settings',
    'cluster',
    'operations',
    'actions',
    'mcp',
    'peerdb',
    'docs',
    'about',
  ] as const) {
    const envKey = `CHM_FEATURE_${feature.toUpperCase()}`
    const enabled = parseBoolean(readEnv(`${envKey}_ENABLED`))
    const accessRaw = readEnv(`${envKey}_ACCESS`)

    const override: FeatureOverride = {}
    if (enabled !== undefined) override.enabled = enabled
    if (accessRaw) {
      try {
        override.access = normalizeFeatureAccess(accessRaw)
      } catch {
        // Ignore invalid values
      }
    }

    if (Object.keys(override).length > 0) {
      overrides = mergeFeatureOverrides(overrides, { [feature]: override })
    }
  }

  return overrides
}
