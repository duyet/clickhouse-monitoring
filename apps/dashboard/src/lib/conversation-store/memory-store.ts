/**
 * In-memory conversation store for development and testing.
 *
 * This is a simple Map-based implementation that stores conversations
 * in memory. Data is lost on process restart.
 *
 * Use this when:
 * - Feature flag is enabled but no database is configured
 * - Running tests or local development
 * - Demonstrating the conversation feature
 *
 * For production, use D1Store or PgStore instead.
 */

import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

/**
 * In-memory storage keyed by userId.
 * Each user has an array of conversations.
 */
const storage = new Map<string, StoredConversation[]>()

/**
 * In-memory conversation store implementation.
 */
export class MemoryStore implements ConversationStore {
  /**
   * List conversations for a user.
   *
   * @param userId - User ID to scope queries
   * @param limit - Maximum number of conversations to return
   * @returns Array of conversation metadata, sorted by updatedAt DESC
   */
  async list(userId: string, limit?: number): Promise<ConversationMeta[]> {
    const conversations = storage.get(userId) || []

    // Sort by updatedAt DESC (most recent first)
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

    // Apply limit if specified
    const limited = limit ? sorted.slice(0, limit) : sorted

    // Return metadata only (no messages)
    return limited.map(({ messages, ...meta }) => meta)
  }

  /**
   * Get a single conversation with full messages.
   *
   * @param userId - User ID to scope queries
   * @param conversationId - Conversation ID to retrieve
   * @returns Conversation with messages, or null if not found
   */
  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    const conversations = storage.get(userId) || []

    const found = conversations.find((c) => c.id === conversationId)

    if (!found) {
      return null
    }

    // Return a copy to prevent external mutations
    return { ...found, messages: [...found.messages] }
  }

  /**
   * Create or update a conversation.
   *
   * @param conversation - Full conversation to upsert
   */
  async upsert(conversation: StoredConversation): Promise<void> {
    const { userId, id } = conversation

    // Get user's conversations or initialize empty array
    let conversations = storage.get(userId) || []

    // Find existing conversation index
    const existingIndex = conversations.findIndex((c) => c.id === id)

    if (existingIndex >= 0) {
      // Update existing conversation
      // Store a copy to prevent external mutations
      conversations[existingIndex] = {
        ...conversation,
        messages: [...conversation.messages],
      }
    } else {
      // Add new conversation
      // Store a copy to prevent external mutations
      conversations.push({
        ...conversation,
        messages: [...conversation.messages],
      })
    }

    // Sort by updatedAt DESC to keep array ordered
    conversations = conversations.sort((a, b) => b.updatedAt - a.updatedAt)

    // Save back to storage
    storage.set(userId, conversations)
  }

  /**
   * Delete a single conversation.
   *
   * @param userId - User ID to scope queries
   * @param conversationId - Conversation ID to delete
   */
  async delete(userId: string, conversationId: string): Promise<void> {
    const conversations = storage.get(userId) || []

    const filtered = conversations.filter((c) => c.id !== conversationId)

    storage.set(userId, filtered)
  }

  /**
   * Delete all conversations for a user.
   *
   * @param userId - User ID to scope queries
   */
  async deleteAll(userId: string): Promise<void> {
    storage.set(userId, [])
  }

  /**
   * Clear all conversations for all users.
   *
   * Useful for testing to reset state between tests.
   *
   * @internal This is not part of the ConversationStore interface
   */
  static clearAll(): void {
    storage.clear()
  }

  /**
   * Get total number of conversations across all users.
   *
   * Useful for testing and debugging.
   *
   * @internal This is not part of the ConversationStore interface
   */
  static getGlobalCount(): number {
    return Array.from(storage.values()).reduce(
      (sum, conversations) => sum + conversations.length,
      0
    )
  }

  /**
   * Get all user IDs with conversations.
   *
   * Useful for testing and debugging.
   *
   * @internal This is not part of the ConversationStore interface
   */
  static getUserIds(): string[] {
    return Array.from(storage.keys())
  }

  /**
   * Get all stored conversations for all users.
   *
   * Useful for testing and debugging.
   *
   * @internal This is not part of the ConversationStore interface
   */
  static getAllConversations(): Map<string, StoredConversation[]> {
    return new Map(storage)
  }
}
