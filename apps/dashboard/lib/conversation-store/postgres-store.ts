/**
 * PostgreSQL-based conversation storage for production deployments.
 *
 * This module provides a ConversationStore implementation backed by PostgreSQL.
 * It stores conversations with full message history and provides efficient
 * querying for conversation lists using JSONB for native JSON support.
 *
 * Features:
 * - Auto-migration on first query (idempotent CREATE TABLE IF NOT EXISTS)
 * - Connection pooling via postgres package (lightweight, Workers-compatible)
 * - JSONB column for efficient JSON storage and querying
 * - Comprehensive error handling with detailed error codes
 */

import type { UIMessage } from 'ai'
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
  stripMessages,
} from './serialization'
import { ConversationStoreError } from './types'
import postgres from 'postgres'

/**
 * PostgreSQL database schema row shape.
 */
interface PostgresConversationRow {
  id: string
  user_id: string
  title: string
  messages: unknown // JSONB parsed by postgres package
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
  metadata: unknown
  created_at: number
  updated_at: number
}

/**
 * SQL migration script for conversations table.
 *
 * Uses JSONB for messages column (Postgres native JSON type with indexing support).
 * Includes composite index on user_id and updated_at for efficient listing queries.
 */
const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  provider TEXT,
  host_id INTEGER,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  total_cached_tokens INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  finish_reason TEXT,
  user_rating INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations(user_id, updated_at DESC)
  WHERE message_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_model
  ON conversations(model, provider)
  WHERE model IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_cost
  ON conversations(user_id, total_cost_usd)
  WHERE total_cost_usd > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_errors
  ON conversations(user_id, error_count)
  WHERE error_count > 0;
`

function rowToMeta(row: PostgresConversationRow): ConversationMeta {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
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
 * PostgreSQL-based conversation storage implementation.
 *
 * Uses the 'postgres' package (~50KB) which is compatible with:
 * - Node.js server environments
 * - Cloudflare Workers (via @cloudflare/workers-postgres)
 * - Vercel/Netlify serverless functions
 *
 * Auto-migration: Runs CREATE TABLE IF NOT EXISTS on first query.
 *
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 *
 * @example
 * ```ts
 * const store = new PostgresStore()
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
export class PostgresStore implements ConversationStore {
  private sql: ReturnType<typeof postgres>
  private initialized = false

  constructor(connectionString?: string) {
    const url =
      connectionString ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL

    if (!url) {
      throw new ConversationStoreError(
        'DATABASE_URL environment variable is required for PostgreSQL conversation store',
        'STORAGE_ERROR'
      )
    }

    // Create postgres client with connection pooling
    // Default options optimized for serverless/Workers
    this.sql = postgres(url, {
      max: 1, // Single connection for serverless (connection per invocation)
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Disable prepared statements for better compatibility
    })
  }

  /**
   * Ensure database schema exists.
   *
   * Runs migration on first query (idempotent).
   * Safe to call multiple times - uses CREATE TABLE IF NOT EXISTS.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Run migration (idempotent)
      await this.sql.unsafe(MIGRATION_SQL)
      this.initialized = true
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to initialize database schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * List conversations for a user.
   *
   * Returns metadata only (no messages) for efficiency. Results are sorted
   * by updated_at DESC to show most recently active conversations first.
   *
   * Uses composite index (user_id, updated_at) for optimal query performance.
   *
   * @param userId - User ID to scope queries
   * @param limit - Maximum number of conversations to return (default: 50)
   * @returns Array of conversation metadata
   */
  async list(userId: string, limit: number = 50): Promise<ConversationMeta[]> {
    await this.ensureInitialized()

    try {
      const rows = (await this.sql`
        SELECT
          id, user_id, title, message_count,
          model, provider, host_id,
          total_input_tokens, total_output_tokens, total_reasoning_tokens,
          total_cached_tokens, total_duration_ms, total_cost_usd,
          finish_reason, user_rating, error_count, metadata,
          created_at, updated_at
        FROM conversations
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `) as PostgresConversationRow[]

      return rows.map(rowToMeta)
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
   * Messages are returned as JavaScript objects (postgres package
   * automatically parses JSONB columns).
   *
   * @param userId - User ID to scope queries (security check)
   * @param conversationId - Conversation ID to retrieve
   * @returns Conversation with messages, or null if not found
   */
  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    await this.ensureInitialized()

    try {
      const rows = (await this.sql`
        SELECT
          id, user_id, title, messages, message_count,
          model, provider, host_id,
          total_input_tokens, total_output_tokens, total_reasoning_tokens,
          total_cached_tokens, total_duration_ms, total_cost_usd,
          finish_reason, user_rating, error_count, metadata,
          created_at, updated_at
        FROM conversations
        WHERE id = ${conversationId} AND user_id = ${userId}
      `) as PostgresConversationRow[]

      if (!rows || rows.length === 0) {
        return null
      }

      const row = rows[0]

      // postgres package automatically parses JSONB to JavaScript objects
      // No need for JSON.parse
      const messages = (row.messages as unknown[]).filter(
        (msg): msg is UIMessage =>
          msg !== null &&
          typeof msg === 'object' &&
          'id' in msg &&
          'role' in msg
      )

      return {
        ...rowToMeta(row),
        messages,
      }
    } catch (error) {
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
   * Uses PostgreSQL's INSERT ... ON CONFLICT (upsert) semantics:
   * - If conversation exists: replaces all fields including messages
   * - If conversation doesn't exist: creates new conversation
   *
   * Messages are serialized to JSONB (Postgres automatically converts
   * JavaScript objects to JSONB).
   *
   * @param conversation - Full conversation to upsert
   */
  async upsert(conversation: StoredConversation): Promise<void> {
    await this.ensureInitialized()

    try {
      const normalized = normalizeConversation(conversation)
      const messagesJson = JSON.stringify(normalized.messages)
      const metadataJson = metadataToJson(normalized.metadata)

      await this.sql`
        INSERT INTO conversations (
          id, user_id, title, messages, message_count,
          model, provider, host_id,
          total_input_tokens, total_output_tokens, total_reasoning_tokens,
          total_cached_tokens, total_duration_ms, total_cost_usd,
          finish_reason, user_rating, error_count, metadata,
          created_at, updated_at
        )
        VALUES (
          ${normalized.id},
          ${normalized.userId},
          ${normalized.title},
          ${messagesJson}::jsonb,      -- Cast string to JSONB
          ${normalized.messageCount},
          ${normalized.model ?? null},
          ${normalized.provider ?? null},
          ${normalized.hostId ?? null},
          ${normalized.totalInputTokens ?? 0},
          ${normalized.totalOutputTokens ?? 0},
          ${normalized.totalReasoningTokens ?? 0},
          ${normalized.totalCachedTokens ?? 0},
          ${normalized.totalDurationMs ?? 0},
          ${normalized.totalCostUsd ?? 0},
          ${normalized.finishReason ?? null},
          ${normalized.userRating ?? null},
          ${normalized.errorCount ?? 0},
          ${metadataJson}::jsonb,
          ${normalized.createdAt},
          ${normalized.updatedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          title = EXCLUDED.title,
          messages = EXCLUDED.messages,
          message_count = EXCLUDED.message_count,
          model = EXCLUDED.model,
          provider = EXCLUDED.provider,
          host_id = EXCLUDED.host_id,
          total_input_tokens = EXCLUDED.total_input_tokens,
          total_output_tokens = EXCLUDED.total_output_tokens,
          total_reasoning_tokens = EXCLUDED.total_reasoning_tokens,
          total_cached_tokens = EXCLUDED.total_cached_tokens,
          total_duration_ms = EXCLUDED.total_duration_ms,
          total_cost_usd = EXCLUDED.total_cost_usd,
          finish_reason = EXCLUDED.finish_reason,
          user_rating = EXCLUDED.user_rating,
          error_count = EXCLUDED.error_count,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `
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
   * Includes user_id check for security (prevents cross-user deletion).
   *
   * @param userId - User ID to scope queries (security check)
   * @param conversationId - Conversation ID to delete
   */
  async delete(userId: string, conversationId: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.sql`
        DELETE FROM conversations
        WHERE id = ${conversationId} AND user_id = ${userId}
      `
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
   * Useful for user data deletion requests (GDPR, etc).
   *
   * @param userId - User ID to scope queries
   */
  async deleteAll(userId: string): Promise<void> {
    await this.ensureInitialized()

    try {
      await this.sql`
        DELETE FROM conversations
        WHERE user_id = ${userId}
      `
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to delete all conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  /**
   * Close the database connection.
   *
   * Call this when shutting down the application to gracefully
   * close the PostgreSQL connection.
   *
   * @example
   * ```ts
   * const store = new PostgresStore()
   * // ... use store
   * await store.close()
   * ```
   */
  async close(): Promise<void> {
    try {
      await this.sql.end()
    } catch (_error) {
      // Ignore errors during close (connection may already be closed)
    }
  }
}

export function toPostgresConversationMeta(
  conversation: StoredConversation
): ConversationMeta {
  return stripMessages(conversation)
}
