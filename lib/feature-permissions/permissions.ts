import type { FeaturePermission } from './types'

export const AGENT_FEATURE_PERMISSION = {
  feature: 'agent',
  defaultAccess: 'authenticated',
} satisfies FeaturePermission

export const ACTIONS_FEATURE_PERMISSION = {
  feature: 'actions',
  defaultAccess: 'authenticated',
} satisfies FeaturePermission

export const TABLES_FEATURE_PERMISSION = {
  feature: 'tables',
  defaultAccess: 'authenticated',
} satisfies FeaturePermission

export const OVERVIEW_FEATURE_PERMISSION = {
  feature: 'overview',
} satisfies FeaturePermission

export const SETTINGS_FEATURE_PERMISSION = {
  feature: 'settings',
} satisfies FeaturePermission

export const CLUSTER_FEATURE_PERMISSION = {
  feature: 'cluster',
} satisfies FeaturePermission
