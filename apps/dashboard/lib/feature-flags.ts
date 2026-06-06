/**
 * Feature flag system for gradual rollout of new features.
 *
 * Feature flags are controlled via environment variables.
 * All flags default to false (unset) for safety — features must be explicitly enabled.
 */

import { error } from '@chm/logger'
import { isConversationPersistenceEnabled } from '@/lib/conversation-store/config'

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
   * Deprecated compatibility helper. Runtime store selection is controlled by
   * AGENT_CONVERSATION_PERSISTENCE and AGENT_CONVERSATION_STORE.
   *
   * @default false (unset)
   * @env AGENT_CONVERSATION_PERSISTENCE
   * @env NEXT_PUBLIC_FEATURE_CONVERSATION_DB Deprecated alias
   */
  conversationDb: (): boolean => {
    try {
      return isConversationPersistenceEnabled()
    } catch (err) {
      error('[featureFlags.conversationDb] Config check failed', err)
      return false
    }
  },
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
