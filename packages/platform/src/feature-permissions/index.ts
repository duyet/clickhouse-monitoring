/**
 * Shared feature-permission module for CHM apps.
 *
 * Re-export everything from the sub-modules so apps can import from
 * `@chm/platform/feature-permissions` or `@chm/platform`.
 */

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
} from './types'

export {
  parseBoolean,
  parseFeaturesConfig,
  parseLegacyFeatureOverrides,
  splitEnvList,
} from './features-config'
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
} from './shared'
export { FEATURE_ACCESS_VALUES, FEATURE_IDS } from './types'
