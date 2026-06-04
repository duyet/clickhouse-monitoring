export const FEATURE_ACCESS_VALUES = ['public', 'authenticated'] as const

export type FeatureAccess = (typeof FEATURE_ACCESS_VALUES)[number]

export const FEATURE_IDS = [
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
] as const

export type FeatureId = (typeof FEATURE_IDS)[number]

export interface FeaturePermission {
  feature: FeatureId
  /**
   * Default access when no operator config overrides this feature.
   *
   * @default public
   */
  defaultAccess?: FeatureAccess
  /**
   * When true, an `authenticated`-only feature is NOT blocked at the route
   * level for anonymous principals — the page renders and the feature gates
   * the auth-requiring *interaction* itself (e.g. the agent shows its chat UI
   * and only prompts for sign-in when the user tries to send a message).
   *
   * @default false
   */
  interactionGated?: boolean
}

export interface FeatureOverride {
  enabled?: boolean
  access?: FeatureAccess
}

export interface FeatureState {
  enabled: boolean
  access: FeatureAccess
}

export type FeatureOverrides = Partial<Record<FeatureId, FeatureOverride>>

export type Principal = 'anonymous' | 'authenticated'

export type ResolvedFeatureStates = Record<FeatureId, FeatureState>

export interface PublicFeaturePermissionConfig {
  authProvider: 'none' | 'clerk' | 'proxy'
  principal: Principal
  features: FeatureOverrides
  resolved?: ResolvedFeatureStates
}
