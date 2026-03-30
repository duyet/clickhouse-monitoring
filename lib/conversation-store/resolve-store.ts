/**
 * Conversation store resolver for runtime backend detection.
 *
 * Automatically selects the appropriate conversation store implementation
 * based on environment configuration and feature flags.
 */

import type { ConversationStore } from './types'

import { BrowserStore } from './browser-store'
import { D1Store } from './d1-store'
import { MemoryStore } from './memory-store'
import { PostgresStore } from './postgres-store'
import { featureFlags } from '@/lib/feature-flags'
import { getPlatformBindings } from '@/lib/platform'

/**
 * Environment variable names for database configuration.
 */
const D1_BINDING_NAME = 'CONVERSATIONS_D1'
const DATABASE_URL = 'DATABASE_URL'

/**
 * Resolves the appropriate conversation store implementation at runtime.
 *
 * Resolution priority:
 * 1. Feature flag disabled → BrowserStore (localStorage)
 * 2. D1 binding available → D1Store (Cloudflare D1)
 * 3. DATABASE_URL env var → PostgresStore
 * 4. No database config → MemoryStore with warning
 *
 * @returns Promise resolving to ConversationStore instance
 *
 * @example
 * ```ts
 * const store = await resolveStore()
 * await store.saveConversation('user-123', { messages: [] })
 * ```
 */
export async function resolveStore(): Promise<ConversationStore> {
  // 1. Check if conversations DB feature is disabled
  if (!featureFlags.conversationDb()) {
    return new BrowserStore()
  }

  // 2. Check for Cloudflare D1 binding (highest priority for serverless)
  try {
    const db = getPlatformBindings().getD1Database(D1_BINDING_NAME)
    if (db) {
      // D1Store gets the binding internally via getPlatformBindings()
      return new D1Store()
    }
  } catch {
    // Not in Cloudflare environment or no binding - continue to next check
  }

  // 3. Check for Postgres DATABASE_URL (traditional database)
  if (process.env[DATABASE_URL]) {
    return new PostgresStore(process.env[DATABASE_URL])
  }

  // 4. Fallback to MemoryStore with warning
  if (process.env.NODE_ENV === 'development' || process.env.CI) {
    console.warn(
      '[ConversationStore] No database configured (D1 binding or DATABASE_URL). ' +
        'Using MemoryStore - conversations will be lost on restart. ' +
        'Set DATABASE_URL or deploy to Cloudflare with D1 binding for persistence.'
    )
  }

  return new MemoryStore()
}

/**
 * Type guard to check if a store is persistent (D1 or Postgres).
 *
 * @param store - ConversationStore instance
 * @returns true if store persists data beyond runtime
 */
export function isPersistentStore(store: ConversationStore): boolean {
  return (
    store instanceof D1Store ||
    store instanceof PostgresStore ||
    store instanceof BrowserStore
  )
}
