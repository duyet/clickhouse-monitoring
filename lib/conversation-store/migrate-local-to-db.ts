/**
 * Migration utility for localStorage conversations to database.
 *
 * One-time migration that:
 * 1. Checks if feature flag is enabled
 * 2. Verifies migration hasn't already completed
 * 3. Loads conversations from localStorage
 * 4. Uploads each conversation to the database via API
 * 5. Marks migration as complete
 *
 * Retries on next page load if migration fails.
 * Keeps localStorage data as backup (doesn't delete).
 */

import type { StoredConversation } from './types'

import { loadConversations } from '@/lib/ai/agent/conversation-utils'
import { featureFlags } from '@/lib/feature-flags'
import { debug, error, warn } from '@/lib/logger'

/**
 * localStorage key for migration completion flag.
 */
const MIGRATION_FLAG_KEY = 'conversations-migrated-to-db'

/**
 * API endpoint for upserting conversations.
 */
const CONVERSATIONS_API_BASE = '/api/v1/conversations'

/**
 * Result of migrating a single conversation.
 */
interface MigrationResult {
  conversationId: string
  success: boolean
  error?: string
}

/**
 * Migration statistics.
 */
interface MigrationStats {
  total: number
  succeeded: number
  failed: number
  errors: Array<{ conversationId: string; title: string; error: string }>
}

/**
 * Check if migration has already completed.
 *
 * @returns true if migration flag is set in localStorage
 */
export function hasMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true'
  } catch {
    // localStorage unavailable (SSR or private browsing)
    return false
  }
}

/**
 * Mark migration as completed in localStorage.
 *
 * This prevents re-running migration on subsequent page loads.
 */
function markMigrated(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
    debug('[migration] Marked migration as complete')
  } catch (err) {
    warn('[migration] Failed to set migration flag', err)
  }
}

/**
 * Upload a single conversation to the database via API.
 *
 * Uses PUT /api/v1/conversations/[id] to upsert the conversation.
 *
 * @param conversation - Conversation to upload
 * @returns Promise resolving to success status and optional error message
 */
async function uploadConversation(
  conversation: StoredConversation
): Promise<MigrationResult> {
  const { id, title } = conversation

  try {
    debug('[migration] Uploading conversation', { id, title })

    const response = await fetch(`${CONVERSATIONS_API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: conversation.title,
        messages: conversation.messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `API returned ${response.status}: ${errorText || response.statusText}`
      )
    }

    debug('[migration] Successfully uploaded conversation', { id, title })

    return { conversationId: id, success: true }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[migration] Failed to upload conversation', {
      id,
      title,
      error: errorMessage,
    })

    return { conversationId: id, success: false, error: errorMessage }
  }
}

/**
 * Migrate conversations from localStorage to database.
 *
 * Prerequisites:
 * 1. Feature flag NEXT_PUBLIC_FEATURE_CONVERSATION_DB must be enabled
 * 2. Migration must not have already completed
 * 3. At least one conversation exists in localStorage
 *
 * Process:
 * 1. Load all conversations from localStorage
 * 2. Upload each conversation to database via PUT /api/v1/conversations/[id]
 * 3. Mark migration as complete if all uploads succeed
 * 4. Log statistics and any errors encountered
 *
 * Error handling:
 * - Logs errors but continues with remaining conversations
 * - Only marks as migrated if ALL uploads succeed
 * - Can be retried on next page load if migration fails
 * - localStorage data is kept as backup (never deleted)
 *
 * @returns Promise resolving to migration statistics
 *
 * @example
 * ```ts
 * import { migrateLocalToDb } from '@/lib/conversation-store/migrate-local-to-db'
 *
 * // Call on app initialization (e.g., in layout.tsx or root component)
 * await migrateLocalToDb()
 * ```
 */
export async function migrateLocalToDb(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  }

  // Check 1: Feature flag must be enabled
  if (!featureFlags.conversationDb()) {
    debug('[migration] Feature flag disabled, skipping migration')
    return stats
  }

  // Check 2: Already migrated?
  if (hasMigrated()) {
    debug('[migration] Already migrated, skipping')
    return stats
  }

  // Check 3: Load conversations from localStorage
  const conversations = loadConversations()

  if (!conversations || conversations.length === 0) {
    debug('[migration] No conversations to migrate')
    // Still mark as migrated so we don't check again
    markMigrated()
    return stats
  }

  stats.total = conversations.length

  debug('[migration] Starting migration', {
    total: stats.total,
  })

  // Upload each conversation sequentially
  const results: MigrationResult[] = []

  for (const conversation of conversations) {
    const storedConv: StoredConversation = {
      id: conversation.id,
      userId: 'local', // Will be reassigned to authenticated user by API
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
      messages: conversation.messages,
    }

    const result = await uploadConversation(storedConv)
    results.push(result)

    if (result.success) {
      stats.succeeded++
    } else {
      stats.failed++
      stats.errors.push({
        conversationId: conversation.id,
        title: conversation.title,
        error: result.error || 'Unknown error',
      })
    }
  }

  // Only mark as migrated if ALL uploads succeeded
  if (stats.failed === 0) {
    markMigrated()
    debug('[migration] Migration completed successfully', {
      total: stats.total,
      succeeded: stats.succeeded,
    })
  } else {
    warn('[migration] Migration completed with errors', {
      total: stats.total,
      succeeded: stats.succeeded,
      failed: stats.failed,
      errors: stats.errors,
    })
  }

  return stats
}
