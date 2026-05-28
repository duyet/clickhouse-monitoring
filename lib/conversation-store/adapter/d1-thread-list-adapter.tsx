'use client'

/**
 * D1 / server-backed assistant-ui thread list adapter.
 *
 * Used when `NEXT_PUBLIC_FEATURE_CONVERSATION_DB` is enabled (Cloudflare
 * Workers deployments). Persists threads + messages through the existing
 * `/api/v1/conversations/*` routes, which resolve to D1 / Postgres server-side.
 *
 * Implements the same `RemoteThreadListAdapter` contract as the localStorage
 * backend so the two are interchangeable behind `resolve-thread-list-adapter`.
 */

import type {
  GenericThreadHistoryAdapter,
  MessageFormatAdapter,
  MessageFormatRepository,
  RemoteThreadListAdapter,
  ThreadHistoryAdapter,
} from '@assistant-ui/react'
import type { FC, PropsWithChildren } from 'react'

import { RuntimeAdapterProvider, useAui } from '@assistant-ui/react'
import { createAssistantStream } from 'assistant-stream'
import { generateTitleFromMessage } from '@/lib/ai/agent/conversation-utils'
import {
  replaceHistoryItem,
  upsertHistoryItem,
} from '@/lib/conversation-store/adapter/generic-history'
import { apiFetch } from '@/lib/swr/api-fetch'

const BASE = '/api/v1/conversations'

/** In-memory cache so per-turn `append()` calls do not refetch every time. */
const repoCache = new Map<string, MessageFormatRepository<unknown>>()

function unwrap(json: unknown): Record<string, unknown> {
  if (json && typeof json === 'object') {
    const record = json as Record<string, unknown>
    if (record.data && typeof record.data === 'object') {
      return record.data as Record<string, unknown>
    }
    return record
  }
  return {}
}

async function apiList(): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await apiFetch(`${BASE}?limit=100`)
    if (!res.ok) return []
    const body = unwrap(await res.json().catch(() => ({})))
    const conversations = body.conversations ?? body
    return Array.isArray(conversations)
      ? (conversations as Array<Record<string, unknown>>)
      : []
  } catch {
    return []
  }
}

async function apiGet(id: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`)
    if (!res.ok) return null
    const body = unwrap(await res.json().catch(() => ({})))
    return (body.conversation as Record<string, unknown> | undefined) ?? null
  } catch {
    return null
  }
}

async function apiPut(
  id: string,
  payload: { title?: string; messages?: unknown[] }
): Promise<void> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`PUT failed with status ${res.status}`)
    }
  } catch {
    // Network / non-OK response — keep the cached copy; next append retries.
  }
}

async function apiDelete(id: string): Promise<void> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`DELETE failed with status ${res.status}`)
    }
  } catch {
    // ignore — deletion is best-effort
  }
}

function deriveTitle(
  message: { role?: string; parts?: unknown[] } | undefined
): string | undefined {
  if (!message || message.role !== 'user' || !Array.isArray(message.parts)) {
    return undefined
  }
  for (const part of message.parts) {
    if (
      part &&
      typeof part === 'object' &&
      (part as { type?: unknown }).type === 'text' &&
      typeof (part as { text?: unknown }).text === 'string'
    ) {
      const text = ((part as { text: string }).text ?? '').trim()
      if (text) {
        return text.length > 50 ? `${text.slice(0, 50)}...` : text
      }
    }
  }
  return undefined
}

/**
 * Per-thread message history backed by the conversations API. `useChatRuntime`
 * calls `withFormat()` for a format-bound `GenericThreadHistoryAdapter`; the
 * stored `MessageFormatItem[]` is kept in the conversation's `messages` field.
 */
function createD1HistoryAdapter(
  aui: ReturnType<typeof useAui>
): ThreadHistoryAdapter {
  return {
    async load() {
      return { messages: [] }
    },
    async append() {},
    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
      formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>
    ): GenericThreadHistoryAdapter<TMessage> {
      const getId = (message: TMessage) => formatAdapter.getId(message)
      const getCachedRepo = (
        remoteId: string
      ): MessageFormatRepository<TMessage> =>
        (repoCache.get(remoteId) as
          | MessageFormatRepository<TMessage>
          | undefined) ?? { messages: [] }

      return {
        async load() {
          const remoteId = aui.threadListItem().getState().remoteId
          if (!remoteId) return { messages: [] }
          const conversation = await apiGet(remoteId)
          const stored = conversation?.messages
          const messages = Array.isArray(stored)
            ? (stored as MessageFormatRepository<TMessage>['messages'])
            : []
          const repo: MessageFormatRepository<TMessage> = {
            messages,
            headId: messages.length
              ? getId(messages[messages.length - 1].message)
              : undefined,
          }
          repoCache.set(remoteId, repo)
          return repo
        },
        async append(item) {
          const { remoteId } = await aui.threadListItem().initialize()
          const repo = getCachedRepo(remoteId)
          upsertHistoryItem(repo, item, getId)
          repoCache.set(remoteId, repo)

          const payload: { messages: unknown[]; title?: string } = {
            messages: repo.messages,
          }
          // Seed the title from the first message only — never overwrite.
          if (!aui.threadListItem().getState().title) {
            const title = deriveTitle(
              item.message as { role?: string; parts?: unknown[] }
            )
            if (title) payload.title = title
          }
          await apiPut(remoteId, payload)
        },
        async update(item, localMessageId) {
          const remoteId = aui.threadListItem().getState().remoteId
          if (!remoteId) return
          const repo = getCachedRepo(remoteId)
          replaceHistoryItem(repo, item, localMessageId, getId)
          repoCache.set(remoteId, repo)
          await apiPut(remoteId, { messages: repo.messages })
        },
      }
    },
  }
}

const HistoryProvider: FC<PropsWithChildren> = ({ children }) => {
  const aui = useAui()
  const history = createD1HistoryAdapter(aui)
  const adapters = { history }
  return (
    <RuntimeAdapterProvider adapters={adapters as never}>
      {children}
    </RuntimeAdapterProvider>
  )
}

/**
 * Build a `RemoteThreadListAdapter` backed by the D1 conversations API.
 */
export function createD1ThreadListAdapter(): RemoteThreadListAdapter {
  return {
    unstable_Provider: HistoryProvider,

    async list() {
      const conversations = await apiList()
      return {
        threads: conversations
          .filter((conversation) => typeof conversation.id === 'string')
          .map((conversation) => ({
            remoteId: conversation.id as string,
            externalId: undefined,
            status: 'regular' as const,
            title:
              typeof conversation.title === 'string'
                ? conversation.title
                : undefined,
            custom:
              typeof conversation.createdAt === 'number'
                ? { createdAt: conversation.createdAt }
                : undefined,
          })),
      }
    },

    async initialize(threadId) {
      await apiPut(threadId, { messages: [] })
      repoCache.set(threadId, { messages: [] })
      return { remoteId: threadId, externalId: undefined }
    },

    async rename(remoteId, newTitle) {
      await apiPut(remoteId, { title: newTitle })
    },

    async archive() {
      // The conversations API has no archive state — treated as a no-op.
    },

    async unarchive() {
      // No-op — see `archive`.
    },

    async delete(remoteId) {
      repoCache.delete(remoteId)
      await apiDelete(remoteId)
    },

    async fetch(threadId) {
      const conversation = await apiGet(threadId)
      return {
        remoteId: threadId,
        externalId: undefined,
        status: 'regular',
        title:
          conversation && typeof conversation.title === 'string'
            ? conversation.title
            : undefined,
      }
    },

    async generateTitle(remoteId) {
      const conversation = await apiGet(remoteId)
      const messages = Array.isArray(conversation?.messages)
        ? (conversation.messages as Array<Record<string, unknown>>)
        : []
      const firstUserMsg = messages.find((m) => m.role === 'user')
      const text =
        typeof firstUserMsg?.content === 'string'
          ? firstUserMsg.content
          : Array.isArray(firstUserMsg?.content)
            ? (firstUserMsg.content as Array<{ text?: string }>)
                .map((p) => p.text ?? '')
                .join(' ')
            : ''

      const title = text ? generateTitleFromMessage(text) : 'New Chat'

      // Persist the title server-side
      await apiPut(remoteId, { title })

      return createAssistantStream((controller) => {
        controller.appendText(title)
      })
    },
  }
}
