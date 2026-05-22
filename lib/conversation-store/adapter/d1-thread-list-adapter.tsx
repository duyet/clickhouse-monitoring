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

import type { RemoteThreadListAdapter } from '@assistant-ui/react'

import { RuntimeAdapterProvider, useAui } from '@assistant-ui/react'
import { createAssistantStream } from 'assistant-stream'
import { type FC, type PropsWithChildren, useMemo } from 'react'
import { apiFetch } from '@/lib/swr/api-fetch'

const BASE = '/api/v1/conversations'

interface MessageRepo {
  messages: Array<{
    message: { id: string; role?: string; parts?: unknown[] }
  }>
  headId?: string
}

/** In-memory cache so per-turn `append()` calls do not refetch every time. */
const repoCache = new Map<string, MessageRepo>()

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
    await apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Network failure — keep the cached copy; next append retries.
  }
}

async function apiDelete(id: string): Promise<void> {
  try {
    await apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    // ignore
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

class D1HistoryAdapter {
  constructor(private readonly aui: ReturnType<typeof useAui>) {}

  async load(): Promise<MessageRepo> {
    const remoteId = this.aui.threadListItem().getState().remoteId
    if (!remoteId) return { messages: [] }

    const conversation = await apiGet(remoteId)
    const stored = conversation?.messages
    const messages = Array.isArray(stored)
      ? (stored as MessageRepo['messages'])
      : []
    const repo: MessageRepo = {
      messages,
      headId: messages.at(-1)?.message.id,
    }
    repoCache.set(remoteId, repo)
    return repo
  }

  async append(item: {
    message: { id: string; role?: string; parts?: unknown[] }
  }): Promise<void> {
    const { remoteId } = await this.aui.threadListItem().initialize()

    const repo = repoCache.get(remoteId) ?? { messages: [] }
    const index = repo.messages.findIndex(
      (entry) => entry.message.id === item.message.id
    )
    if (index >= 0) {
      repo.messages[index] = item
    } else {
      repo.messages.push(item)
    }
    repo.headId = item.message.id
    repoCache.set(remoteId, repo)

    const title = deriveTitle(item.message)
    await apiPut(remoteId, {
      messages: repo.messages,
      ...(title ? { title } : {}),
    })
  }
}

const HistoryProvider: FC<PropsWithChildren> = ({ children }) => {
  const aui = useAui()
  const history = useMemo(() => new D1HistoryAdapter(aui), [aui])
  const adapters = useMemo(() => ({ history }), [history])
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
      void remoteId
      return createAssistantStream(() => {})
    },
  }
}
