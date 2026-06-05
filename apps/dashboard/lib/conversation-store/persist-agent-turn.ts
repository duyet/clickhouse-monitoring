import type { FinishReason, UIMessage } from 'ai'
import type { AgentUsageStats } from '@/lib/ai/agent/analytics'
import type { StoredConversation } from './types'

import { resolveUserId } from './auth'
import { getConversationStoreConfig } from './config'
import { resolveConversationStoreStatus, resolveStore } from './resolve-store'
import { deriveConversationTitle } from './serialization'
import { ConversationStoreError } from './types'

interface PersistAgentConversationTurnOptions {
  conversationId: string
  messages: UIMessage[]
  hostId: number
  model: string
  provider: string
  resolvedModel?: string
  usage?: AgentUsageStats
  finishReason?: FinishReason
  sessionId: string
}

export async function persistAgentConversationTurn({
  conversationId,
  messages,
  hostId,
  model,
  provider,
  resolvedModel,
  usage,
  finishReason,
  sessionId,
}: PersistAgentConversationTurnOptions): Promise<void> {
  const config = getConversationStoreConfig()
  const status = resolveConversationStoreStatus(config)

  if (!status.enabled || !status.persistent) return

  let userId: string
  try {
    userId = await resolveUserId()
  } catch (error) {
    if (error instanceof ConversationStoreError) {
      return
    }
    throw error
  }

  const existing = await resolveStore()
    .then((store) => store.get(userId, conversationId))
    .catch((error) => {
      if (
        error instanceof ConversationStoreError &&
        error.code === 'NOT_FOUND'
      ) {
        return null
      }
      throw error
    })

  const now = Date.now()
  const conversation: StoredConversation = {
    id: conversationId,
    userId,
    title: existing?.title || deriveConversationTitle(messages),
    messages,
    messageCount: messages.length,
    model: resolvedModel || model,
    provider,
    hostId,
    totalInputTokens: usage?.totalInputTokens ?? 0,
    totalOutputTokens: usage?.totalOutputTokens ?? 0,
    totalReasoningTokens: usage?.reasoningTokens ?? 0,
    totalCachedTokens:
      (usage?.cacheReadTokens ?? 0) + (usage?.cacheWriteTokens ?? 0),
    totalCostUsd: usage?.estimatedCostUsd ?? 0,
    finishReason,
    errorCount: finishReason === 'error' ? 1 : 0,
    metadata: {
      source: 'agent-finish',
      sessionId,
      requestedModel: model,
      resolvedModel,
      usage,
      store: status.store,
    },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  const store = await resolveStore()
  await store.upsert(conversation)
}
