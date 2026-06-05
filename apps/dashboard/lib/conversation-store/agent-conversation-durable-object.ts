import type { ConversationMeta, StoredConversation } from './types'

import {
  jsonToMetadata,
  metadataToJson,
  normalizeConversation,
  normalizeOptionalNumber,
  normalizeOptionalString,
  parseMessages,
  stripMessages,
} from './serialization'
import { DurableObject } from 'cloudflare:workers'

interface DurableConversationRow {
  [key: string]: SqlStorageValue
  id: string
  user_id: string
  title: string
  messages: string
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

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages TEXT NOT NULL DEFAULT '[]',
  message_count INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  provider TEXT,
  host_id INTEGER,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  total_cached_tokens INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  finish_reason TEXT,
  user_rating INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);
`

function rowToConversation(row: DurableConversationRow): StoredConversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: parseMessages(row.messages),
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class AgentConversationDurableObject extends DurableObject<CloudflareEnv> {
  private readonly sql: SqlStorage

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(SCHEMA_SQL)
    })
  }

  async list(userId: string, limit: number = 50): Promise<ConversationMeta[]> {
    const rows = this.sql
      .exec<DurableConversationRow>(
        `SELECT *
         FROM conversations
         WHERE user_id = ?
         ORDER BY updated_at DESC
         LIMIT ?`,
        userId,
        Math.min(Math.max(limit, 1), 100)
      )
      .toArray()

    return rows.map(rowToConversation).map(stripMessages)
  }

  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    const rows = this.sql
      .exec<DurableConversationRow>(
        `SELECT *
         FROM conversations
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        conversationId,
        userId
      )
      .toArray()

    return rows[0] ? rowToConversation(rows[0]) : null
  }

  async upsert(conversation: StoredConversation): Promise<void> {
    const normalized = normalizeConversation(conversation)
    this.sql.exec(
      `INSERT INTO conversations (
         id, user_id, title, messages, message_count,
         model, provider, host_id,
         total_input_tokens, total_output_tokens, total_reasoning_tokens,
         total_cached_tokens, total_duration_ms, total_cost_usd,
         finish_reason, user_rating, error_count, metadata,
         created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
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
         updated_at = excluded.updated_at`,
      normalized.id,
      normalized.userId,
      normalized.title,
      JSON.stringify(normalized.messages),
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
      metadataToJson(normalized.metadata),
      normalized.createdAt,
      normalized.updatedAt
    )
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    this.sql.exec(
      `DELETE FROM conversations WHERE id = ? AND user_id = ?`,
      conversationId,
      userId
    )
  }

  async deleteAll(userId: string): Promise<void> {
    this.sql.exec(`DELETE FROM conversations WHERE user_id = ?`, userId)
  }
}
