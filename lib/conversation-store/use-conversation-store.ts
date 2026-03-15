'use client'

import useSWR, { useSWRConfig } from 'swr'

import type {
  ConversationMeta,
  ConversationStore,
  StoredConversation,
} from './types'

import { browserStore } from './browser-store'
import { ConversationStoreError } from './types'
import { useMemo } from 'react'
import { featureFlags } from '@/lib/feature-flags'

/**
 * Default user ID for unauthenticated/guest users.
 */
const GUEST_USER_ID = 'guest'

/**
 * SWR cache key prefix for conversation operations.
 */
const CACHE_KEY_PREFIX = '/api/v1/conversations'

/**
 * Build SWR cache key for conversation list.
 */
function buildListKey(userId: string, limit?: number): string {
  const params = new URLSearchParams()
  params.append('userId', userId)
  if (limit) params.append('limit', String(limit))
  return `${CACHE_KEY_PREFIX}?${params.toString()}`
}

/**
 * Build SWR cache key for single conversation.
 */
function buildConversationKey(userId: string, conversationId: string): string {
  return `${CACHE_KEY_PREFIX}/${conversationId}?userId=${userId}`
}

/**
 * Fetcher wrapper for API calls.
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string }
    }
    const error = new Error(
      errorData.error?.message || `Failed to fetch: ${response.statusText}`
    ) as Error & { status?: number; code?: string }

    error.status = response.status
    if (errorData.error?.code) {
      error.code = errorData.error.code
    }

    throw error
  }

  return response.json() as Promise<T>
}

/**
 * Return type for useConversationStore hook.
 */
export interface UseConversationStoreReturn {
  /**
   * List conversations for the current user.
   *
   * @param limit - Maximum number of conversations to return
   * @returns Promise resolving to array of conversation metadata
   */
  list: (limit?: number) => Promise<ConversationMeta[]>

  /**
   * Get a single conversation by ID.
   *
   * @param conversationId - Conversation ID to retrieve
   * @returns Promise resolving to conversation with messages, or null if not found
   */
  get: (conversationId: string) => Promise<StoredConversation | null>

  /**
   * Create or update a conversation.
   *
   * @param conversation - Conversation to upsert
   * @returns Promise that resolves when upsert completes
   */
  upsert: (conversation: StoredConversation) => Promise<void>

  /**
   * Delete a conversation by ID.
   *
   * @param conversationId - Conversation ID to delete
   * @returns Promise that resolves when deletion completes
   */
  delete: (conversationId: string) => Promise<void>

  /**
   * Delete all conversations for the current user.
   *
   * @returns Promise that resolves when deletion completes
   */
  deleteAll: () => Promise<void>

  /**
   * SWR data for conversation list (only available in API mode).
   */
  listData?: ConversationMeta[]

  /**
   * SWR loading state for conversation list.
   */
  listLoading?: boolean

  /**
   * SWR error state for conversation list.
   */
  listError?: Error

  /**
   * Whether the hook is using API mode (true) or BrowserStore mode (false).
   */
  isApiMode: boolean
}

/**
 * Client-side hook for conversation store with SWR caching.
 *
 * When the conversationDb feature flag is disabled (default):
 * - Delegates to BrowserStore (localStorage)
 * - All operations are synchronous with existing behavior
 *
 * When the conversationDb feature flag is enabled:
 * - Uses API routes for data fetching
 * - SWR caches list() results for performance
 * - get() uses SWR per-conversation caching
 * - upsert/delete/deleteAll mutate cache automatically
 *
 * @returns UseConversationStoreReturn interface with store methods and SWR state
 *
 * @example
 * ```tsx
 * 'use client'
 * import { useConversationStore } from '@/lib/conversation-store/use-conversation-store'
 *
 * export function ConversationList() {
 *   const { list, listData, listLoading, listError } = useConversationStore()
 *
 *   useEffect(() => {
 *     list(20).then(console.log)
 *   }, [list])
 *
 *   if (listLoading) return <div>Loading...</div>
 *   if (listError) return <div>Error: {listError.message}</div>
 *
 *   return (
 *     <ul>
 *       {listData?.map(conv => (
 *         <li key={conv.id}>{conv.title}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useConversationStore(): UseConversationStoreReturn {
  const { mutate } = useSWRConfig()
  const isApiMode = featureFlags.conversationDb()

  // Resolve store implementation based on feature flag
  const store = useMemo<ConversationStore>(() => {
    if (isApiMode) {
      // In API mode, we still need a store instance for direct operations
      // This will be resolved server-side via API routes
      return resolveApiStore()
    }
    return browserStore
  }, [isApiMode])

  // Build list cache key (in API mode)
  const listKey = isApiMode ? buildListKey(GUEST_USER_ID) : null

  // SWR hook for conversation list (API mode only)
  const {
    data: listData,
    error: listError,
    isLoading: listLoading,
  } = useSWR<ConversationMeta[], Error>(
    listKey,
    isApiMode ? () => fetcher<ConversationMeta[]>(listKey!) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10_000,
    }
  )

  /**
   * List conversations for the current user.
   */
  const list = async (limit?: number): Promise<ConversationMeta[]> => {
    if (!isApiMode) {
      // BrowserStore mode: direct call
      return store.list(GUEST_USER_ID, limit)
    }

    // API mode: use SWR data if available
    const key = buildListKey(GUEST_USER_ID, limit)
    const result = await mutate<ConversationMeta[]>(
      key,
      fetcher<ConversationMeta[]>(key),
      false // don't revalidate existing data
    )

    return result || []
  }

  /**
   * Get a single conversation by ID.
   */
  const get = async (
    conversationId: string
  ): Promise<StoredConversation | null> => {
    if (!isApiMode) {
      // BrowserStore mode: direct call
      return store.get(GUEST_USER_ID, conversationId)
    }

    // API mode: use SWR for per-conversation caching
    const key = buildConversationKey(GUEST_USER_ID, conversationId)

    try {
      const result = await mutate<StoredConversation | null>(
        key,
        fetcher<StoredConversation | null>(key),
        false
      )
      return result || null
    } catch (error) {
      // Return null on 404 (conversation not found)
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        return null
      }
      throw error
    }
  }

  /**
   * Create or update a conversation.
   */
  const upsert = async (conversation: StoredConversation): Promise<void> => {
    // Ensure userId is set
    const conversationWithUserId = {
      ...conversation,
      userId: GUEST_USER_ID,
    }

    if (!isApiMode) {
      // BrowserStore mode: direct call
      return store.upsert(conversationWithUserId)
    }

    // API mode: POST to API and mutate cache
    const response = await fetch(`${CACHE_KEY_PREFIX}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationWithUserId),
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new Error(
        errorData.error?.message || `Failed to upsert: ${response.statusText}`
      )
    }

    // Mutate list cache to include the updated conversation
    await mutate(buildListKey(GUEST_USER_ID))

    // Mutate individual conversation cache
    await mutate(
      buildConversationKey(GUEST_USER_ID, conversation.id),
      conversationWithUserId
    )
  }

  /**
   * Delete a conversation by ID.
   */
  const deleteConv = async (conversationId: string): Promise<void> => {
    if (!isApiMode) {
      // BrowserStore mode: direct call
      return store.delete(GUEST_USER_ID, conversationId)
    }

    // API mode: DELETE and mutate cache
    const response = await fetch(
      `${CACHE_KEY_PREFIX}/${conversationId}?userId=${GUEST_USER_ID}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new Error(
        errorData.error?.message || `Failed to delete: ${response.statusText}`
      )
    }

    // Mutate list cache to remove the conversation
    await mutate(
      buildListKey(GUEST_USER_ID),
      (current = []) =>
        current.filter((c: ConversationMeta) => c.id !== conversationId),
      false
    )

    // Remove individual conversation from cache
    await mutate(buildConversationKey(GUEST_USER_ID, conversationId), null)
  }

  /**
   * Delete all conversations for the current user.
   */
  const deleteAll = async (): Promise<void> => {
    if (!isApiMode) {
      // BrowserStore mode: direct call
      return store.deleteAll(GUEST_USER_ID)
    }

    // API mode: DELETE all and mutate cache
    const response = await fetch(
      `${CACHE_KEY_PREFIX}?userId=${GUEST_USER_ID}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new Error(
        errorData.error?.message ||
          `Failed to delete all: ${response.statusText}`
      )
    }

    // Clear list cache
    await mutate(buildListKey(GUEST_USER_ID), [])
  }

  return {
    list,
    get,
    upsert,
    delete: deleteConv,
    deleteAll,
    listData,
    listLoading,
    listError,
    isApiMode,
  }
}

/**
 * API-mode store implementation that calls API routes.
 * Used client-side when conversationDb feature flag is enabled.
 */
function resolveApiStore(): ConversationStore {
  return new ApiStore()
}

/**
 * API-backed store implementation for client-side use.
 *
 * This implementation calls the API routes rather than directly
 * accessing the database, maintaining the server-side data layer.
 */
class ApiStore implements ConversationStore {
  async list(userId: string, limit?: number): Promise<ConversationMeta[]> {
    const params = new URLSearchParams()
    params.append('userId', userId)
    if (limit) params.append('limit', String(limit))

    const url = `${CACHE_KEY_PREFIX}?${params.toString()}`
    return fetcher<ConversationMeta[]>(url)
  }

  async get(
    userId: string,
    conversationId: string
  ): Promise<StoredConversation | null> {
    const url = `${CACHE_KEY_PREFIX}/${conversationId}?userId=${userId}`

    try {
      return await fetcher<StoredConversation>(url)
    } catch (error) {
      // Return null on 404 (conversation not found)
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        return null
      }
      throw error
    }
  }

  async upsert(conversation: StoredConversation): Promise<void> {
    const response = await fetch(CACHE_KEY_PREFIX, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversation),
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new ConversationStoreError(
        errorData.error?.message || `Failed to upsert: ${response.statusText}`,
        'STORAGE_ERROR'
      )
    }
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    const response = await fetch(
      `${CACHE_KEY_PREFIX}/${conversationId}?userId=${userId}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new ConversationStoreError(
        errorData.error?.message || `Failed to delete: ${response.statusText}`,
        'STORAGE_ERROR'
      )
    }
  }

  async deleteAll(userId: string): Promise<void> {
    const response = await fetch(`${CACHE_KEY_PREFIX}?userId=${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new ConversationStoreError(
        errorData.error?.message ||
          `Failed to delete all: ${response.statusText}`,
        'STORAGE_ERROR'
      )
    }
  }
}
