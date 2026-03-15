/**
 * Feature flag system for gradual rollout of new features.
 *
 * Feature flags are controlled via environment variables.
 * All flags default to false (unset) for safety — features must be explicitly enabled.
 */

/**
 * Feature flag definitions.
 *
 * Each flag is a function that reads the environment variable at runtime.
 * This allows flags to be changed without rebuilding the application.
 */
export const featureFlags = {
  /**
   * Enable persistent database storage for AI agent conversations.
   *
   * When enabled, conversations are stored in D1 (Cloudflare Workers) or PostgreSQL
   * instead of localStorage. Requires Clerk auth for user isolation.
   *
   * @default false (unset)
   * @env NEXT_PUBLIC_FEATURE_CONVERSATION_DB
   */
  conversationDb: (): boolean =>
    process.env.NEXT_PUBLIC_FEATURE_CONVERSATION_DB === 'true',
} as const

/**
 * Type-safe feature flag names.
 */
export type FeatureFlagName = keyof typeof featureFlags

/**
 * Check if a feature flag is enabled.
 *
 * @param flag - Feature flag name
 * @returns true if the flag is enabled
 *
 * @example
 * ```ts
 * if (isFeatureEnabled('conversationDb')) {
 *   // Use database storage
 * } else {
 *   // Use localStorage
 * }
 * ```
 */
export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return featureFlags[flag]()
}
