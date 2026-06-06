/**
 * D1-based conversation storage for Cloudflare Workers.
 *
 * This module provides a ConversationStore implementation backed by Cloudflare D1
 * (SQLite-based database). It stores conversations with full message history
 * and provides efficient querying for conversation lists.
 */

import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

import {
  jsonToMetadata,
  metadataToJson,
  normalizeConversation,
  normalizeOptionalNumber,
  normalizeOptionalString,
  parseMessages,
  stripMessages,
} from './serialization'
import { ConversationStoreError } from './types'
import { getPlatformBindings } from '@chm/platform'

/**
 * D1 database schema row shape.
 */
interface D1ConversationRow {
  id: string
  user_id: string
  title: string
  messages: string // JSON string
  message_count: number
  model: string | null
  provider: string | null
  host_id: number | null
  total_input_tokens: number
  total_output_tokens: number
  total_reasoning_tokens: number
  total_cached_tokens: number
  total_duration_ms: number
  total_cost_usd: number
  finish_reason: string | null
  user_rating: number | null
  error_count: number
  metadata: string
  created_at: number
  updated_at: number
}

function rowToMeta(row: D1ConversationRow): ConversationMeta {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count,
    model: normalizeOptionalString(row.model),
    provider: normalizeOptionalString(row.provider),
    hostId: normalizeOptionalNumber(row.host_id),
    totalInputTokens: row.total_input_tokens,
    totalOutputTokens: row.total_output_tokens,
    totalReasoningTokens: row.total_reasoning_tokens,
    totalCachedTokens: row.total_cached_tokens,
    totalDurationMs: row.total_duration_ms,
    totalCostUsd: row.total_cost_usd,
    finishReason: normalizeOptionalString(row.finish_reason),
    userRating: normalizeOptionalNumber(row.user_rating),
    errorCount: row.error_count,
    metadata: jsonToMetadata(row.metadata),
  }
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
    const db = getPlatformBindings().getD1Database('CONVERSATIONS_D1')

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
             , model, provider, host_id, total_input_tokens, total_output_tokens
             , total_reasoning_tokens, total_cached_tokens, total_duration_ms
             , total_cost_usd, finish_reason, user_rating, error_count, metadata
           FROM conversations
           WHERE user_id = ?1
           ORDER BY updated_at DESC
           LIMIT ?2`
        )
        .bind(userId, limit)

      const result = await stmt.all<D1ConversationRow>()

      return (result.results || []).map(rowToMeta)
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
             , model, provider, host_id, total_input_tokens, total_output_tokens
             , total_reasoning_tokens, total_cached_tokens, total_duration_ms
             , total_cost_usd, finish_reason, user_rating, error_count, metadata
           FROM conversations
           WHERE id = ?1 AND user_id = ?2`
        )
        .bind(conversationId, userId)

      const result = await stmt.first<D1ConversationRow>()

      if (!result) {
        return null
      }

      return {
        ...rowToMeta(result),
        messages: parseMessages(result.messages),
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

      const normalized = normalizeConversation(conversation)
      const messagesJson = JSON.stringify(normalized.messages)
      const metadataJson = metadataToJson(normalized.metadata)

      const stmt = db
        .prepare(
          `INSERT INTO conversations (
             id, user_id, title, messages, message_count,
             model, provider, host_id,
             total_input_tokens, total_output_tokens, total_reasoning_tokens,
             total_cached_tokens, total_duration_ms, total_cost_usd,
             finish_reason, user_rating, error_count, metadata,
             created_at, updated_at
           )
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)
           ON CONFLICT (id) DO UPDATE SET
             user_id = excluded.user_id,
             title = excluded.title,
             messages = excluded.messages,
             message_count = excluded.message_count,
             model = excluded.model,
             provider = excluded.provider,
             host_id = excluded.host_id,
             total_input_tokens = excluded.total_input_tokens,
             total_output_tokens = excluded.total_output_tokens,
             total_reasoning_tokens = excluded.total_reasoning_tokens,
             total_cached_tokens = excluded.total_cached_tokens,
             total_duration_ms = excluded.total_duration_ms,
             total_cost_usd = excluded.total_cost_usd,
             finish_reason = excluded.finish_reason,
             user_rating = excluded.user_rating,
             error_count = excluded.error_count,
             metadata = excluded.metadata,
             updated_at = excluded.updated_at`
        )
        .bind(
          normalized.id,
          normalized.userId,
          normalized.title,
          messagesJson,
          normalized.messageCount,
          normalized.model ?? null,
          normalized.provider ?? null,
          normalized.hostId ?? null,
          normalized.totalInputTokens ?? 0,
          normalized.totalOutputTokens ?? 0,
          normalized.totalReasoningTokens ?? 0,
          normalized.totalCachedTokens ?? 0,
          normalized.totalDurationMs ?? 0,
          normalized.totalCostUsd ?? 0,
          normalized.finishReason ?? null,
          normalized.userRating ?? null,
          normalized.errorCount ?? 0,
          metadataJson,
          normalized.createdAt,
          normalized.updatedAt
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

export function toD1ConversationMeta(
  conversation: StoredConversation
): ConversationMeta {
  return stripMessages(conversation)
}
