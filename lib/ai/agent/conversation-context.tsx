'use client'

import type { UIMessage } from 'ai'
import type { Conversation } from './conversation-utils'

import {
  generateConversationId,
  generateTitleFromMessage,
  loadConversations,
  saveConversations,
} from './conversation-utils'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// ============================================================================
// Types
// ============================================================================

interface ConversationContextValue {
  /** All conversations, sorted by updatedAt descending */
  conversations: Conversation[]
  /** ID of the currently active conversation */
  currentConversationId: string | null
  /** Create a new conversation and set it as current */
  createNewConversation: () => string
  /** Delete a conversation by ID */
  deleteConversation: (id: string) => void
  /** Switch to a different conversation */
  switchConversation: (id: string) => void
  /** Update messages for a conversation */
  updateMessages: (id: string, messages: UIMessage[]) => void
}

// ============================================================================
// Context
// ============================================================================

const ConversationContext = createContext<ConversationContextValue>({
  conversations: [],
  currentConversationId: null,
  createNewConversation: () => '',
  deleteConversation: () => {},
  switchConversation: () => {},
  updateMessages: () => {},
})

// ============================================================================
// Provider
// ============================================================================

interface ConversationProviderProps {
  children: React.ReactNode
}

/**
 * Provider for managing AI agent conversation state.
 *
 * Handles:
 * - Loading/saving conversations to localStorage
 * - Creating new conversations
 * - Switching between conversations
 * - Deleting conversations
 * - Updating conversation messages
 *
 * Conversations are automatically sorted by updatedAt timestamp (newest first).
 */
export function ConversationProvider({ children }: ConversationProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null)

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loaded = loadConversations()

    if (loaded.length === 0) {
      // Create default conversation if none exist
      const defaultId = generateConversationId()
      const defaultConversation: Conversation = {
        id: defaultId,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      }
      const withDefault = [defaultConversation]
      setConversations(withDefault)
      setCurrentConversationId(defaultId)
      saveConversations(withDefault)
    } else {
      // Sort by updatedAt descending (newest first)
      const sorted = loaded.sort((a, b) => b.updatedAt - a.updatedAt)
      setConversations(sorted)
      // Set most recent as current
      setCurrentConversationId(sorted[0].id)
    }
  }, [])

  /**
   * Create a new conversation and set it as current.
   * Returns the new conversation ID.
   */
  const createNewConversation = useCallback((): string => {
    const newId = generateConversationId()
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }

    setConversations((prev) => {
      const updated = [newConversation, ...prev]
      saveConversations(updated)
      return updated
    })

    setCurrentConversationId(newId)
    return newId
  }, [])

  /**
   * Delete a conversation by ID.
   * If deleting the current conversation, switch to the most recent one.
   */
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id)

        // If we deleted the current conversation, switch to another
        if (currentConversationId === id) {
          setCurrentConversationId(filtered.length > 0 ? filtered[0].id : null)
        }

        saveConversations(filtered)
        return filtered
      })
    },
    [currentConversationId]
  )

  /**
   * Switch to a different conversation.
   * Note: The caller is responsible for loading the messages into useChat.
   */
  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
  }, [])

  /**
   * Update messages for a conversation and refresh its updatedAt timestamp.
   * Also auto-generates title if this is the first user message.
   */
  const updateMessages = useCallback((id: string, messages: UIMessage[]) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === id)
      if (index === -1) return prev

      const conversation = prev[index]
      const now = Date.now()

      // Auto-generate title from first user message if still default
      let title = conversation.title
      if (title === 'New Conversation' && messages.length > 0) {
        const firstUserMessage = messages.find((m) => m.role === 'user')
        if (firstUserMessage) {
          // Extract text from first message part
          const textPart = firstUserMessage.parts.find((p) => p.type === 'text')
          if (textPart && 'text' in textPart) {
            title = generateTitleFromMessage(textPart.text)
          }
        }
      }

      // Update the conversation
      const updated: Conversation = {
        ...conversation,
        title,
        messages,
        updatedAt: now,
      }

      // Re-sort conversations by updatedAt (move updated to top)
      const updatedList = [updated, ...prev.filter((c) => c.id !== id)]

      saveConversations(updatedList)
      return updatedList
    })
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<ConversationContextValue>(
    () => ({
      conversations,
      currentConversationId,
      createNewConversation,
      deleteConversation,
      switchConversation,
      updateMessages,
    }),
    [
      conversations,
      currentConversationId,
      createNewConversation,
      deleteConversation,
      switchConversation,
      updateMessages,
    ]
  )

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the conversation context.
 *
 * @throws {Error} If used outside of ConversationProvider
 *
 * @example
 * ```tsx
 * const { conversations, currentConversationId, createNewConversation } = useConversationContext()
 * ```
 */
export function useConversationContext(): ConversationContextValue {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error(
      'useConversationContext must be used within a ConversationProvider'
    )
  }
  return context
}
