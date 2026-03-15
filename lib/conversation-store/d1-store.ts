/**
 * D1-based conversation storage for Cloudflare Workers.
 *
 * This module provides a ConversationStore implementation backed by Cloudflare D1
 * (SQLite-based database). It stores conversations with full message history
 * and provides efficient querying for conversation lists.
 */

import type { UIMessage } from 'ai'
import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

import { ConversationStoreError } from './types'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Extend CloudflareEnv interface to include CONVERSATIONS_D1 binding.
 * This is needed for type safety when accessing the D1 database via getCloudflareContext().
 */
declare global {
  interface CloudflareEnv {
    CONVERSATIONS_D1: D1Database
  }
}

/**
 * D1 database schema row shape.
 */
interface D1ConversationRow {
  id: string
  user_id: string
  title: string
  messages: string // JSON string
  message_count: number
  created_at: number
  updated_at: number
}

/**
 * D1-based conversation storage implementation.
 *
 * Uses Cloudflare D1 (SQLite) for persistent storage of AI agent conversations.
 * Messages are stored as JSON strings since D1 doesn't support JSONB.
 *
 * @example
 * ```ts
 * const store = new D1Store()
 * await store.upsert({
 *   id: 'conv-123',
 *   userId: 'user-abc',
 *   title: 'My Conversation',
 *   messages: [...],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 *   messageCount: 5
 * })
 * ```
 */
export class D1Store implements ConversationStore {
  private getDb(): D1Database {
    const ctx = getCloudflareContext()
    const db = ctx?.env.CONVERSATIONS_D1

    if (!db) {
      throw new ConversationStoreError(
        'CONVERSATIONS_D1 binding not found. Ensure D1 database is configured in wrangler.toml',
        'STORAGE_ERROR'
      )
    }

    return db
  }

  /**
   * List conversations for a user.
   *
   * Returns metadata only (no messages) for efficiency. Results are sorted
   * by updated_at DESC to show most recently active conversations first.
   *
   * @param userId - User ID to scope queries
   * @param limit - Maximum number of conversations to return (default: 50)
   * @returns Array of conversation metadata
   */
  async list(userId: string, limit: number = 50): Promise<ConversationMeta[]> {
    try {
      const db = this.getDb()

      const stmt = db
        .prepare(
          `SELECT id, user_id, title, message_count, created_at, updated_at
           FROM conversations
           WHERE user_id = ?1
           ORDER BY updated_at DESC
           LIMIT ?2`
        )
        .bind(userId, limit)

      const result = await stmt.all<D1ConversationRow>()

      return (result.results || []).map(
        (row): ConversationMeta => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          messageCount: row.message_count,
        })
      )
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to list conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * Get a single conversation with full messages.
   *
   * @param userId - User ID to scope queries (security check)
   * @param conversationId - Conversation ID to retrieve
   * @returns Conversation with messages, or null if not found
   */
  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    try {
      const db = this.getDb()

      const stmt = db
        .prepare(
          `SELECT id, user_id, title, messages, message_count, created_at, updated_at
           FROM conversations
           WHERE id = ?1 AND user_id = ?2`
        )
        .bind(conversationId, userId)

      const result = await stmt.first<D1ConversationRow>()

      if (!result) {
        return null
      }

      // Parse messages JSON string
      let messages: UIMessage[]
      try {
        messages = JSON.parse(result.messages) as UIMessage[]
      } catch (error) {
        throw new ConversationStoreError(
          `Failed to parse messages JSON for conversation ${conversationId}`,
          'STORAGE_ERROR',
          error
        )
      }

      return {
        id: result.id,
        userId: result.user_id,
        title: result.title,
        messages,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        messageCount: result.message_count,
      }
    } catch (error) {
      if (error instanceof ConversationStoreError) {
        throw error
      }
      throw new ConversationStoreError(
        `Failed to get conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * Create or update a conversation.
   *
   * Uses UPSERT (INSERT OR REPLACE) semantics:
   * - If conversation exists: replaces all fields including messages
   * - If conversation doesn't exist: creates new conversation
   *
   * @param conversation - Full conversation to upsert
   */
  async upsert(conversation: StoredConversation): Promise<void> {
    try {
      const db = this.getDb()

      // Serialize messages to JSON string
      const messagesJson = JSON.stringify(conversation.messages)

      const stmt = db
        .prepare(
          `INSERT INTO conversations (id, user_id, title, messages, message_count, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           ON CONFLICT (id) DO UPDATE SET
             user_id = excluded.user_id,
             title = excluded.title,
             messages = excluded.messages,
             message_count = excluded.message_count,
             updated_at = excluded.updated_at`
        )
        .bind(
          conversation.id,
          conversation.userId,
          conversation.title,
          messagesJson,
          conversation.messageCount,
          conversation.createdAt,
          conversation.updatedAt
        )

      await stmt.run()
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to upsert conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * Delete a single conversation.
   *
   * @param userId - User ID to scope queries (security check)
   * @param conversationId - Conversation ID to delete
   */
  async delete(userId: string, conversationId: string): Promise<void> {
    try {
      const db = this.getDb()

      const stmt = db
        .prepare(`DELETE FROM conversations WHERE id = ?1 AND user_id = ?2`)
        .bind(conversationId, userId)

      await stmt.run()
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * Delete all conversations for a user.
   *
   * @param userId - User ID to scope queries
   */
  async deleteAll(userId: string): Promise<void> {
    try {
      const db = this.getDb()

      const stmt = db
        .prepare(`DELETE FROM conversations WHERE user_id = ?1`)
        .bind(userId)

      await stmt.run()
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to delete all conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }
}
