import type { UIMessage } from 'ai'
import type {
  ConversationMeta,
  ConversationMetadata,
  StoredConversation,
} from './types'

import { deriveTitleFromUserMessage } from '@/lib/ai/agent/conversation-utils'

export function parseJsonObject(
  value: unknown
): Record<string, unknown> | undefined {
  if (!value) return undefined
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value !== 'string') return undefined

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}

export function parseMessages(value: unknown): UIMessage[] {
  if (Array.isArray(value)) return value as UIMessage[]
  if (typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : []
  } catch {
    return []
  }
}

export function metadataToJson(
  metadata: ConversationMetadata | undefined
): string {
  return JSON.stringify(metadata ?? {})
}

export function jsonToMetadata(
  value: unknown
): ConversationMetadata | undefined {
  return parseJsonObject(value) as ConversationMetadata | undefined
}

export function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function deriveConversationTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user')
  return deriveTitleFromUserMessage(firstUserMessage) ?? 'New Conversation'
}

export function normalizeConversation(
  conversation: StoredConversation
): StoredConversation {
  const now = Date.now()
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages
    : []

  return {
    ...conversation,
    title: conversation.title || deriveConversationTitle(messages),
    messages,
    messageCount: messages.length,
    createdAt: conversation.createdAt || now,
    updatedAt: conversation.updatedAt || now,
    totalInputTokens: conversation.totalInputTokens ?? 0,
    totalOutputTokens: conversation.totalOutputTokens ?? 0,
    totalReasoningTokens: conversation.totalReasoningTokens ?? 0,
    totalCachedTokens: conversation.totalCachedTokens ?? 0,
    totalDurationMs: conversation.totalDurationMs ?? 0,
    totalCostUsd: conversation.totalCostUsd ?? 0,
    errorCount: conversation.errorCount ?? 0,
  }
}

export function stripMessages(
  conversation: StoredConversation
): ConversationMeta {
  const { messages: _messages, ...meta } = conversation
  return meta
}
