'use client'

/**
 * Selects the conversation-history backend for the assistant-ui agent.
 */

import type {
  GenericThreadHistoryAdapter,
  MessageFormatAdapter,
  RemoteThreadListAdapter,
  ThreadHistoryAdapter,
} from '@assistant-ui/react'
import type { FC, PropsWithChildren } from 'react'

import { RuntimeAdapterProvider, useAui } from '@assistant-ui/react'
import {
  createLocalHistoryAdapter,
  createLocalThreadListAdapter,
} from '@/lib/conversation-store/adapter/local-thread-list-adapter'
import {
  createServerHistoryAdapter,
  createServerThreadListAdapter,
} from '@/lib/conversation-store/adapter/server-thread-list-adapter'
import { apiFetch } from '@/lib/swr/api-fetch'

export type ConversationBackend = 'server' | 'local'

interface ConversationStatusResponse {
  enabled?: boolean
}

const STATUS_URL = '/api/v1/conversations/status'
let cachedBackend: {
  backend: ConversationBackend
  expiresAt: number
} | null = null
let inFlightResolvePromise: Promise<ConversationBackend> | null = null

async function resolveConversationBackendAsync(): Promise<ConversationBackend> {
  const now = Date.now()
  if (cachedBackend && cachedBackend.expiresAt > now) {
    return cachedBackend.backend
  }

  if (inFlightResolvePromise) return inFlightResolvePromise

  inFlightResolvePromise = fetchConversationBackend()
  try {
    return await inFlightResolvePromise
  } finally {
    inFlightResolvePromise = null
  }
}

async function fetchConversationBackend(): Promise<ConversationBackend> {
  const now = Date.now()

  try {
    const response = await apiFetch(STATUS_URL, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response.ok) throw new Error(`status ${response.status}`)
    const body = (await response.json()) as ConversationStatusResponse
    const backend = body.enabled ? 'server' : 'local'
    cachedBackend = { backend, expiresAt: now + 30_000 }
    return backend
  } catch {
    if (cachedBackend) {
      cachedBackend = {
        backend: cachedBackend.backend,
        expiresAt: Date.now() + 5_000,
      }
      return cachedBackend.backend
    }

    cachedBackend = { backend: 'local', expiresAt: now + 5_000 }
    return 'local'
  }
}

/**
 * Returns the synchronously-known default backend. Runtime status is resolved
 * inside the adapter methods so env changes do not require a client rebuild.
 */
export function resolveConversationBackend(): ConversationBackend {
  return cachedBackend?.backend ?? 'local'
}

/**
 * Build the active `RemoteThreadListAdapter` for the current deployment.
 */
export function resolveThreadListAdapter(): RemoteThreadListAdapter {
  const serverAdapter = createServerThreadListAdapter()
  const localAdapter = createLocalThreadListAdapter()

  return {
    unstable_Provider: HybridHistoryProvider,

    async list() {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server' ? serverAdapter.list() : localAdapter.list()
    },

    async initialize(threadId) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.initialize(threadId)
        : localAdapter.initialize(threadId)
    },

    async rename(remoteId, newTitle) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.rename(remoteId, newTitle)
        : localAdapter.rename(remoteId, newTitle)
    },

    async archive(remoteId) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.archive(remoteId)
        : localAdapter.archive(remoteId)
    },

    async unarchive(remoteId) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.unarchive(remoteId)
        : localAdapter.unarchive(remoteId)
    },

    async delete(remoteId) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.delete(remoteId)
        : localAdapter.delete(remoteId)
    },

    async fetch(threadId) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.fetch(threadId)
        : localAdapter.fetch(threadId)
    },

    async generateTitle(remoteId, unstableMessages) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? serverAdapter.generateTitle(remoteId, unstableMessages)
        : localAdapter.generateTitle(remoteId, unstableMessages)
    },
  }
}

function createHybridHistoryAdapter(
  aui: ReturnType<typeof useAui>
): ThreadHistoryAdapter {
  const server = createServerHistoryAdapter(aui)
  const local = createLocalHistoryAdapter(aui)

  return {
    async load() {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server' ? server.load() : local.load()
    },
    async append(message) {
      const backend = await resolveConversationBackendAsync()
      return backend === 'server'
        ? server.append(message)
        : local.append(message)
    },
    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
      formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>
    ): GenericThreadHistoryAdapter<TMessage> {
      const serverWithFormat = server.withFormat
      const localWithFormat = local.withFormat
      if (!serverWithFormat || !localWithFormat) {
        throw new Error('Conversation history adapters must support formats.')
      }

      const serverHistory = serverWithFormat(formatAdapter)
      const localHistory = localWithFormat(formatAdapter)

      return {
        async load() {
          const backend = await resolveConversationBackendAsync()
          return backend === 'server'
            ? serverHistory.load()
            : localHistory.load()
        },
        async append(item) {
          const backend = await resolveConversationBackendAsync()
          return backend === 'server'
            ? serverHistory.append(item)
            : localHistory.append(item)
        },
        async update(item, localMessageId) {
          const backend = await resolveConversationBackendAsync()
          return backend === 'server'
            ? serverHistory.update?.(item, localMessageId)
            : localHistory.update?.(item, localMessageId)
        },
      }
    },
  }
}

const HybridHistoryProvider: FC<PropsWithChildren> = ({ children }) => {
  const aui = useAui()
  const history = createHybridHistoryAdapter(aui)
  return (
    <RuntimeAdapterProvider adapters={{ history } as never}>
      {children}
    </RuntimeAdapterProvider>
  )
}
