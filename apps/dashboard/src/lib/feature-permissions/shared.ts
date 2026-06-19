import type {
  FeatureAccess,
  FeatureId,
  FeatureOverride,
  FeatureOverrides,
  FeaturePermission,
  FeatureState,
  PublicFeaturePermissionConfig,
} from './types'

import { FEATURE_ACCESS_VALUES, FEATURE_IDS } from './types'

export const DEFAULT_FEATURE_ACCESS: FeatureAccess = 'public'

export const DEFAULT_FEATURE_STATE: FeatureState = {
  enabled: true,
  access: DEFAULT_FEATURE_ACCESS,
}

/**
 * What an anonymous caller may do, by deployment posture:
 *
 *  - `none`                       → read + write   (everyone is authenticated)
 *  - `clerk` + CHM_CLERK_PUBLIC_READ → read only   (the dash / dash posture)
 *  - `clerk` (default) / `proxy` / `trusted` → nothing (sign in / proxy-auth required)
 *
 * Authenticated callers always get read + write; this only describes the
 * anonymous baseline. Pure (publicRead passed in) so it is shared by the server
 * authorize path and the public config endpoint.
 */
export function anonymousCapabilities(
  authProvider: PublicFeaturePermissionConfig['authProvider'],
  publicRead: boolean
): { read: boolean; write: boolean } {
  if (authProvider === 'none') return { read: true, write: true }
  if (authProvider === 'clerk' && publicRead) {
    return { read: true, write: false }
  }
  return { read: false, write: false }
}

const FEATURE_ID_SET = new Set<string>(FEATURE_IDS)
const FEATURE_ACCESS_SET = new Set<string>(FEATURE_ACCESS_VALUES)
const FEATURE_ACCESS_ALIASES: Record<string, FeatureAccess> = {
  guest: 'public',
}

export function isFeatureId(value: string): value is FeatureId {
  return FEATURE_ID_SET.has(value)
}

export function isFeatureAccess(value: string): value is FeatureAccess {
  return FEATURE_ACCESS_SET.has(value)
}

export function normalizeFeatureId(value: string): FeatureId {
  const normalized = value.trim().toLowerCase().replaceAll('-', '_')
  if (isFeatureId(normalized)) return normalized

  throw new Error(
    `Invalid feature "${value}". Expected one of: ${FEATURE_IDS.join(', ')}.`
  )
}

export function normalizeFeatureAccess(value: string): FeatureAccess {
  const normalized = value.trim().toLowerCase()
  const alias = FEATURE_ACCESS_ALIASES[normalized]
  if (alias) return alias
  if (isFeatureAccess(normalized)) return normalized

  throw new Error(
    `Invalid feature access "${value}". Expected one of: ${FEATURE_ACCESS_VALUES.join(
      ', '
    )}, guest.`
  )
}

export function getDefaultFeatureState(
  permission?: FeaturePermission
): FeatureState {
  return {
    enabled: true,
    access: permission?.defaultAccess ?? DEFAULT_FEATURE_ACCESS,
  }
}

export function resolveFeatureState(
  permission: FeaturePermission | undefined,
  config: Pick<PublicFeaturePermissionConfig, 'features'>
): FeatureState {
  if (!permission) {
    return DEFAULT_FEATURE_STATE
  }

  const override = config.features[permission.feature]
  const base = getDefaultFeatureState(permission)

  return {
    enabled: override?.enabled ?? base.enabled,
    access: override?.access ?? base.access,
  }
}

export function isFeatureAllowed(
  permission: FeaturePermission | undefined,
  config: Pick<PublicFeaturePermissionConfig, 'features'>
): boolean {
  // The frontend is a pure rendering layer: it shows every ENABLED feature in
  // every auth mode. Access enforcement (public vs authenticated) is the backend's
  // job — see `authorizeFeatureRequest` in lib/feature-permissions/server.ts, the
  // single security boundary. A client-side access gate would be both redundant
  // and unreliable: the workerd config endpoint cannot run Clerk's `auth()`, so it
  // always reports `principal: 'anonymous'`, which would wrongly hide authenticated
  // features even from signed-in users. So the only thing that hides a feature on
  // the client is the `enabled` flag (a deployment toggle, not security). Visitors
  // who lack access still see the page; protected data/actions return 401 from the
  // API and the UI surfaces an inline sign-in prompt.
  return resolveFeatureState(permission, config).enabled
}

export function getResolvedFeatureStates(
  config: Pick<PublicFeaturePermissionConfig, 'features'>
): Record<FeatureId, FeatureState> {
  const resolved: Record<string, FeatureState> = {}

  for (const featureId of FEATURE_IDS) {
    resolved[featureId] = resolveFeatureState({ feature: featureId }, config)
  }

  return resolved as Record<FeatureId, FeatureState>
}

export function mergeFeatureOverrides(
  base: FeatureOverrides,
  next: FeatureOverrides
): FeatureOverrides {
  const merged: FeatureOverrides = {}

  for (const [feature, override] of Object.entries(base)) {
    const id = normalizeFeatureId(feature)
    merged[id] = { ...override }
  }

  for (const [feature, override] of Object.entries(next)) {
    const id = normalizeFeatureId(feature)
    const existing: FeatureOverride = merged[id] ?? {}
    merged[id] = {
      ...existing,
      ...override,
    }
  }

  return merged
}
