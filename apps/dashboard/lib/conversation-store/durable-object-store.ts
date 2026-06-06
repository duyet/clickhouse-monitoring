import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

import { ConversationStoreError } from './types'
import { getPlatformBindings } from '@chm/platform'

interface DurableConversationRpc {
  list(userId: string, limit?: number): Promise<ConversationMeta[]>
  get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null>
  upsert(conversation: StoredConversation): Promise<void>
  delete(userId: string, conversationId: string): Promise<void>
  deleteAll(userId: string): Promise<void>
}

export class DurableObjectConversationStore implements ConversationStore {
  constructor(private readonly bindingName = 'AGENT_CONVERSATIONS_DO') {}

  private getStub(userId: string): DurableConversationRpc {
    const namespace = getPlatformBindings().getDurableObjectNamespace(
      this.bindingName
    )

    if (!namespace) {
      throw new ConversationStoreError(
        `${this.bindingName} Durable Object binding not found.`,
        'STORAGE_ERROR'
      )
    }

    return namespace.getByName(userId) as unknown as DurableConversationRpc
  }

  async list(userId: string, limit?: number): Promise<ConversationMeta[]> {
    return this.getStub(userId).list(userId, limit)
  }

  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    return this.getStub(userId).get(userId, conversationId)
  }

  async upsert(conversation: StoredConversation): Promise<void> {
    return this.getStub(conversation.userId).upsert(conversation)
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    return this.getStub(userId).delete(userId, conversationId)
  }

  async deleteAll(userId: string): Promise<void> {
    return this.getStub(userId).deleteAll(userId)
  }
}
