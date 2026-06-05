import type { ConversationStoreConfig } from './config'
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
import { getClient } from '@chm/clickhouse-client'

interface TableIdentifier {
  database: string
  table: string
  qualified: string
}

interface ClickHouseConversationRow {
  conversation_id: string
  user_id: string
  title: string
  messages_json: string
  message_count: number
  model: string
  provider: string
  host_id: number
  total_input_tokens: number
  total_output_tokens: number
  total_reasoning_tokens: number
  total_cached_tokens: number
  total_duration_ms: number
  total_cost_usd: number
  finish_reason: string
  user_rating: number
  error_count: number
  metadata_json: string
  is_deleted: number
  created_at_ms: number
  updated_at_ms: number
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

export function parseClickHouseTableIdentifier(value: string): TableIdentifier {
  const parts = value.split('.')
  if (parts.length !== 2) {
    throw new ConversationStoreError(
      'CLICKHOUSE_AGENT_CONVERSATIONS_TABLE must be a fully-qualified table name: database.table.',
      'VALIDATION_ERROR'
    )
  }

  const [database, table] = parts
  if (!IDENTIFIER_RE.test(database) || !IDENTIFIER_RE.test(table)) {
    throw new ConversationStoreError(
      'CLICKHOUSE_AGENT_CONVERSATIONS_TABLE may only contain unquoted ClickHouse identifiers.',
      'VALIDATION_ERROR'
    )
  }

  return {
    database,
    table,
    qualified: `${database}.${table}`,
  }
}

export function createClickHouseConversationsTableSql(
  tableName: string
): string {
  const table = parseClickHouseTableIdentifier(tableName)
  return `
CREATE TABLE IF NOT EXISTS ${table.qualified} (
  conversation_id String,
  user_id String,
  title String,
  messages_json String CODEC(ZSTD(3)),
  message_count UInt32,
  model LowCardinality(String) DEFAULT '',
  provider LowCardinality(String) DEFAULT '',
  host_id UInt32 DEFAULT 0,
  total_input_tokens UInt64 DEFAULT 0,
  total_output_tokens UInt64 DEFAULT 0,
  total_reasoning_tokens UInt64 DEFAULT 0,
  total_cached_tokens UInt64 DEFAULT 0,
  total_duration_ms UInt64 DEFAULT 0,
  total_cost_usd Float64 DEFAULT 0,
  finish_reason LowCardinality(String) DEFAULT '',
  user_rating Int8 DEFAULT 0,
  error_count UInt32 DEFAULT 0,
  metadata_json String CODEC(ZSTD(3)),
  is_deleted UInt8 DEFAULT 0,
  created_at DateTime64(3) DEFAULT now64(3),
  updated_at DateTime64(3) DEFAULT now64(3),
  created_at_ms UInt64,
  updated_at_ms UInt64
)
ENGINE = ReplacingMergeTree(updated_at_ms, is_deleted)
PARTITION BY toYYYYMM(updated_at)
ORDER BY (user_id, conversation_id, updated_at)
`.trim()
}

function toClickHouseRow(
  conversation: StoredConversation,
  isDeleted = false
): ClickHouseConversationRow {
  const normalized = normalizeConversation(conversation)
  return {
    conversation_id: normalized.id,
    user_id: normalized.userId,
    title: normalized.title,
    messages_json: JSON.stringify(normalized.messages),
    message_count: normalized.messageCount,
    model: normalized.model ?? '',
    provider: normalized.provider ?? '',
    host_id: normalized.hostId ?? 0,
    total_input_tokens: normalized.totalInputTokens ?? 0,
    total_output_tokens: normalized.totalOutputTokens ?? 0,
    total_reasoning_tokens: normalized.totalReasoningTokens ?? 0,
    total_cached_tokens: normalized.totalCachedTokens ?? 0,
    total_duration_ms: normalized.totalDurationMs ?? 0,
    total_cost_usd: normalized.totalCostUsd ?? 0,
    finish_reason: normalized.finishReason ?? '',
    user_rating: normalized.userRating ?? 0,
    error_count: normalized.errorCount ?? 0,
    metadata_json: metadataToJson(normalized.metadata),
    is_deleted: isDeleted ? 1 : 0,
    created_at_ms: normalized.createdAt,
    updated_at_ms: isDeleted ? Date.now() : normalized.updatedAt,
  }
}

function rowToConversation(row: ClickHouseConversationRow): StoredConversation {
  return {
    id: row.conversation_id,
    userId: row.user_id,
    title: row.title,
    messages: parseMessages(row.messages_json),
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
    metadata: jsonToMetadata(row.metadata_json),
    createdAt: row.created_at_ms,
    updatedAt: row.updated_at_ms,
  }
}

export class ClickHouseConversationStore implements ConversationStore {
  private readonly table: TableIdentifier
  private readonly autoCreate: boolean
  private initialized = false

  constructor(config: ConversationStoreConfig) {
    this.table = parseClickHouseTableIdentifier(config.clickHouseTable)
    this.autoCreate = config.clickHouseAutoCreate
  }

  private async getClient() {
    return getClient({
      hostId: 0,
      clickhouseSettings: {
        wait_end_of_query: 1,
      },
    })
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized || !this.autoCreate) return

    try {
      const client = await this.getClient()
      await client.command({
        query: createClickHouseConversationsTableSql(this.table.qualified),
      })
      this.initialized = true
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to initialize ClickHouse conversation table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  private latestRowsQuery(extraWhere = ''): string {
    return `
SELECT
  conversation_id,
  user_id,
  argMax(title, updated_at_ms) AS title,
  argMax(messages_json, updated_at_ms) AS messages_json,
  argMax(message_count, updated_at_ms) AS message_count,
  argMax(model, updated_at_ms) AS model,
  argMax(provider, updated_at_ms) AS provider,
  argMax(host_id, updated_at_ms) AS host_id,
  argMax(total_input_tokens, updated_at_ms) AS total_input_tokens,
  argMax(total_output_tokens, updated_at_ms) AS total_output_tokens,
  argMax(total_reasoning_tokens, updated_at_ms) AS total_reasoning_tokens,
  argMax(total_cached_tokens, updated_at_ms) AS total_cached_tokens,
  argMax(total_duration_ms, updated_at_ms) AS total_duration_ms,
  argMax(total_cost_usd, updated_at_ms) AS total_cost_usd,
  argMax(finish_reason, updated_at_ms) AS finish_reason,
  argMax(user_rating, updated_at_ms) AS user_rating,
  argMax(error_count, updated_at_ms) AS error_count,
  argMax(metadata_json, updated_at_ms) AS metadata_json,
  argMax(is_deleted, updated_at_ms) AS is_deleted,
  argMax(created_at_ms, updated_at_ms) AS created_at_ms,
  max(updated_at_ms) AS updated_at_ms
FROM ${this.table.qualified}
WHERE user_id = {userId:String}${extraWhere}
GROUP BY user_id, conversation_id
HAVING is_deleted = 0
`.trim()
  }

  async list(userId: string, limit: number = 50): Promise<ConversationMeta[]> {
    await this.ensureInitialized()

    try {
      const client = await this.getClient()
      const result = await client.query({
        query: `${this.latestRowsQuery()}
ORDER BY updated_at_ms DESC
LIMIT {limit:UInt32}`,
        format: 'JSONEachRow',
        query_params: {
          userId,
          limit: Math.min(Math.max(limit, 1), 100),
        },
      })
      const rows = (await result.json()) as ClickHouseConversationRow[]
      return rows.map(rowToConversation).map(stripMessages)
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to list ClickHouse conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    await this.ensureInitialized()

    try {
      const client = await this.getClient()
      const result = await client.query({
        query: `${this.latestRowsQuery(' AND conversation_id = {conversationId:String}')}
LIMIT 1`,
        format: 'JSONEachRow',
        query_params: { userId, conversationId },
      })
      const rows = (await result.json()) as ClickHouseConversationRow[]
      return rows[0] ? rowToConversation(rows[0]) : null
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to get ClickHouse conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  async upsert(conversation: StoredConversation): Promise<void> {
    await this.ensureInitialized()

    try {
      const client = await this.getClient()
      await client.insert({
        table: this.table.qualified,
        format: 'JSONEachRow',
        values: [toClickHouseRow(conversation)],
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 1,
        },
      })
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to upsert ClickHouse conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    const existing = await this.get(userId, conversationId)
    if (!existing) return

    try {
      const client = await this.getClient()
      await client.insert({
        table: this.table.qualified,
        format: 'JSONEachRow',
        values: [toClickHouseRow(existing, true)],
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 1,
        },
      })
    } catch (error) {
      throw new ConversationStoreError(
        `Failed to delete ClickHouse conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        error
      )
    }
  }

  async deleteAll(userId: string): Promise<void> {
    const conversations = await this.list(userId, 100)
    await Promise.all(
      conversations.map((conversation) => this.delete(userId, conversation.id))
    )
  }
}
