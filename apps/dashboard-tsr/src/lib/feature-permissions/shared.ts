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
  config: PublicFeaturePermissionConfig
): boolean {
  const state = resolveFeatureState(permission, config)
  if (!state.enabled) return false

  // Interaction-gated features (e.g. the agent) render their UI for everyone
  // and prompt sign-in only on the action (see AgentAuthGate). They are always
  // menu-visible regardless of auth provider or principal — that is the whole
  // point of the flag and matches the menu.ts contract ("Render the chat UI for
  // everyone; sign-in is prompted on send, not at the route level").
  //
  // NOTE: This intentionally takes precedence over the `access: 'authenticated'`
  // gate below. In a fully static workerd deploy the server cannot run Clerk's
  // `auth()`, so /api/v1/config always reports `principal: 'anonymous'`; gating
  // an interaction-gated feature on principal would hide it from signed-in users
  // too. Server routes still enforce auth on the actual action.
  if (permission?.interactionGated) return true

  if (state.access === 'authenticated') {
    return config.principal === 'authenticated'
  }

  return true
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
