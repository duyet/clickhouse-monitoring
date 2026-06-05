import type { UIMessage } from 'ai'
import type { ConversationStoreConfig } from './config'
import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

import {
  deriveConversationTitle,
  jsonToMetadata,
  normalizeConversation,
  normalizeOptionalNumber,
  normalizeOptionalString,
} from './serialization'
import { ConversationStoreError } from './types'
import { extractMessageText } from '@/lib/ai/agent/conversation-utils'

type AgentStateRole = 'system' | 'user' | 'assistant' | 'tool'

interface AgentStateMessage {
  id?: string
  role: AgentStateRole
  content: string
  metadata?: Record<string, unknown> | null
  token_count?: number
  created_at?: number
}

interface AgentStateConversation {
  id: string
  external_id?: string | null
  title?: string | null
  metadata?: Record<string, unknown> | null
  message_count?: number
  token_count?: number
  created_at?: number
  updated_at?: number
  messages?: AgentStateMessage[]
}

const SOURCE = 'clickhouse-monitor'

function uiMessageId(message: UIMessage): string {
  return typeof message.id === 'string' && message.id
    ? message.id
    : crypto.randomUUID()
}

function stableMessageId(message: UIMessage, index?: number): string | null {
  if (typeof message.id === 'string' && message.id) return message.id
  return typeof index === 'number' ? `index:${index}` : null
}

function normalizeRole(role: string): AgentStateRole {
  if (
    role === 'system' ||
    role === 'user' ||
    role === 'assistant' ||
    role === 'tool'
  ) {
    return role
  }
  return 'user'
}

function summarizeNonTextParts(message: UIMessage): string {
  if (!Array.isArray(message.parts) || message.parts.length === 0) return ''
  try {
    return JSON.stringify(message.parts)
  } catch {
    return ''
  }
}

function toAgentStateMessage(message: UIMessage): AgentStateMessage {
  const id = uiMessageId(message)
  const content =
    extractMessageText(message) || summarizeNonTextParts(message) || ''

  return {
    role: normalizeRole(message.role),
    content,
    token_count: 0,
    metadata: {
      ui_message_id: id,
      raw_ui_message: message,
    },
  }
}

function fromAgentStateMessage(message: AgentStateMessage): UIMessage {
  const raw = message.metadata?.raw_ui_message
  if (raw && typeof raw === 'object' && 'role' in raw) {
    return {
      ...(raw as UIMessage),
      id:
        typeof message.metadata?.ui_message_id === 'string'
          ? message.metadata.ui_message_id
          : message.id || crypto.randomUUID(),
    }
  }

  return {
    id:
      typeof message.metadata?.ui_message_id === 'string'
        ? message.metadata.ui_message_id
        : message.id || crypto.randomUUID(),
    role: message.role === 'tool' ? 'assistant' : message.role,
    parts: [{ type: 'text', text: message.content }],
  } as UIMessage
}

function messageSignature(message: UIMessage, index: number): string {
  return JSON.stringify({
    id: stableMessageId(message, index),
    role: message.role,
    parts: message.parts ?? [],
    metadata: message.metadata ?? null,
  })
}

function isAgentStateConversation(
  value: unknown
): value is AgentStateConversation {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).id === 'string'
  )
}

function extractConversations(value: unknown): AgentStateConversation[] {
  if (Array.isArray(value)) return value.filter(isAgentStateConversation)
  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const candidates = [record.conversations, record.data, record.items]
  for (const candidate of candidates) {
    if (Array.isArray(candidate))
      return candidate.filter(isAgentStateConversation)
  }

  return []
}

function extractConversation(value: unknown): AgentStateConversation | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (isAgentStateConversation(record)) return record
  if (isAgentStateConversation(record.conversation)) return record.conversation
  if (isAgentStateConversation(record.data)) return record.data
  return null
}

function conversationMetadata(
  conversation: StoredConversation
): Record<string, unknown> {
  return {
    source: SOURCE,
    user_id: conversation.userId,
    conversation_id: conversation.id,
    model: conversation.model,
    provider: conversation.provider,
    host_id: conversation.hostId,
    total_input_tokens: conversation.totalInputTokens ?? 0,
    total_output_tokens: conversation.totalOutputTokens ?? 0,
    total_reasoning_tokens: conversation.totalReasoningTokens ?? 0,
    total_cached_tokens: conversation.totalCachedTokens ?? 0,
    total_duration_ms: conversation.totalDurationMs ?? 0,
    total_cost_usd: conversation.totalCostUsd ?? 0,
    finish_reason: conversation.finishReason,
    error_count: conversation.errorCount ?? 0,
    raw_metadata: conversation.metadata ?? {},
    ui_message_ids: conversation.messages.map(stableMessageId),
  }
}

function agentStateToStored(
  remote: AgentStateConversation,
  fallbackUserId: string
): StoredConversation | null {
  const externalId = remote.external_id
  if (!externalId) return null

  const metadata = remote.metadata ?? {}
  const messages = (remote.messages ?? []).map(fromAgentStateMessage)
  const rawMetadata = jsonToMetadata(metadata.raw_metadata)

  return {
    id: externalId,
    userId:
      typeof metadata.user_id === 'string' ? metadata.user_id : fallbackUserId,
    title: remote.title || deriveConversationTitle(messages),
    messages,
    messageCount: remote.message_count ?? messages.length,
    model: normalizeOptionalString(metadata.model),
    provider: normalizeOptionalString(metadata.provider),
    hostId: normalizeOptionalNumber(metadata.host_id),
    totalInputTokens: normalizeOptionalNumber(metadata.total_input_tokens),
    totalOutputTokens: normalizeOptionalNumber(metadata.total_output_tokens),
    totalReasoningTokens: normalizeOptionalNumber(
      metadata.total_reasoning_tokens
    ),
    totalCachedTokens: normalizeOptionalNumber(metadata.total_cached_tokens),
    totalDurationMs: normalizeOptionalNumber(metadata.total_duration_ms),
    totalCostUsd: normalizeOptionalNumber(metadata.total_cost_usd),
    finishReason: normalizeOptionalString(metadata.finish_reason),
    errorCount: normalizeOptionalNumber(metadata.error_count),
    metadata: rawMetadata,
    createdAt: remote.created_at ?? Date.now(),
    updatedAt: remote.updated_at ?? Date.now(),
  }
}

export class AgentStateStore implements ConversationStore {
  private readonly apiBase: string
  private readonly apiKey: string

  constructor(config: ConversationStoreConfig) {
    if (!config.agentStateApiKey) {
      throw new ConversationStoreError(
        'AGENTSTATE_API_KEY is required for AgentState conversation storage.',
        'VALIDATION_ERROR'
      )
    }

    this.apiBase = config.agentStateApiBase.replace(/\/+$/, '')
    this.apiKey = config.agentStateApiKey
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: { allowNotFound?: boolean } = {}
  ): Promise<T | null> {
    const response = await fetch(`${this.apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

    if (options.allowNotFound && response.status === 404) {
      return null
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new ConversationStoreError(
        `AgentState request failed: ${response.status} ${body}`,
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : 'STORAGE_ERROR'
      )
    }

    return (await response.json().catch(() => ({}))) as T
  }

  private async getRemoteByExternalId(
    externalId: string
  ): Promise<AgentStateConversation | null> {
    const body = await this.request<unknown>(
      `/v1/conversations/by-external-id/${encodeURIComponent(externalId)}`,
      {},
      { allowNotFound: true }
    )
    return extractConversation(body)
  }

  private async createRemote(conversation: StoredConversation): Promise<void> {
    await this.request('/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({
        external_id: conversation.id,
        title: conversation.title,
        metadata: conversationMetadata(conversation),
        messages: conversation.messages.map(toAgentStateMessage),
      }),
    })
  }

  private async appendRemoteMessages(
    remoteId: string,
    messages: UIMessage[]
  ): Promise<void> {
    if (messages.length === 0) return
    await this.request(
      `/v1/conversations/${encodeURIComponent(remoteId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map(toAgentStateMessage),
        }),
      }
    )
  }

  private async updateRemoteMeta(
    remoteId: string,
    conversation: StoredConversation
  ): Promise<void> {
    await this.request(`/v1/conversations/${encodeURIComponent(remoteId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: conversation.title,
        metadata: conversationMetadata(conversation),
      }),
    })
  }

  async list(userId: string, limit: number = 50): Promise<ConversationMeta[]> {
    const body = await this.request<unknown>(
      `/v1/conversations?limit=${Math.min(Math.max(limit, 1), 100)}&order=desc`
    )

    return extractConversations(body)
      .filter(
        (remote) =>
          remote.metadata?.source === SOURCE &&
          remote.metadata?.user_id === userId
      )
      .map((remote) => agentStateToStored(remote, userId))
      .filter(
        (conversation): conversation is StoredConversation =>
          !!conversation && conversation.userId === userId
      )
      .map(({ messages: _messages, ...meta }) => meta)
  }

  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    const remote = await this.getRemoteByExternalId(conversationId)
    if (!remote) return null
    if (
      remote.metadata?.source !== SOURCE ||
      remote.metadata?.user_id !== userId
    ) {
      return null
    }

    const conversation = agentStateToStored(remote, userId)
    if (!conversation || conversation.userId !== userId) return null
    return conversation
  }

  async upsert(conversation: StoredConversation): Promise<void> {
    const normalized = normalizeConversation(conversation)
    const remote = await this.getRemoteByExternalId(normalized.id)

    if (!remote) {
      await this.createRemote(normalized)
      return
    }

    const persistedMessages = (remote.messages ?? []).map(fromAgentStateMessage)
    const persistedSignatures = persistedMessages.map(messageSignature)
    const nextSignatures = normalized.messages.map(messageSignature)

    const canAppend =
      persistedSignatures.length <= nextSignatures.length &&
      persistedSignatures.every(
        (signature, index) => signature === nextSignatures[index]
      )

    if (!canAppend) {
      await this.request(`/v1/conversations/${encodeURIComponent(remote.id)}`, {
        method: 'DELETE',
      })
      await this.createRemote(normalized)
      return
    }

    await this.appendRemoteMessages(
      remote.id,
      normalized.messages.slice(persistedMessages.length)
    )
    await this.updateRemoteMeta(remote.id, normalized)
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.get(userId, conversationId)
    if (!conversation) return

    const remote = await this.getRemoteByExternalId(conversationId)
    if (remote) {
      await this.request(`/v1/conversations/${encodeURIComponent(remote.id)}`, {
        method: 'DELETE',
      })
    }
  }

  async deleteAll(userId: string): Promise<void> {
    const conversations = await this.list(userId, 100)
    await Promise.all(
      conversations.map((conversation) => this.delete(userId, conversation.id))
    )
  }
}
