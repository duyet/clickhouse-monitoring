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

export interface PublicFeaturePermissionConfig {
  authProvider: 'none' | 'clerk'
  principal: Principal
  features: FeatureOverrides
}
