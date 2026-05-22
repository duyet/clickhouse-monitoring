'use client'

/**
 * localStorage-backed assistant-ui thread list adapter.
 *
 * Replicates assistant-ui's internal `createLocalStorageAdapter` (which is not
 * publicly exported) so the agent's conversation history persists entirely in
 * the browser. This is the default backend — used by self-hosted / Docker
 * deployments where the ClickHouse connection is read-only and no server-side
 * conversation store is available.
 */

import type { RemoteThreadListAdapter } from '@assistant-ui/react'

import { RuntimeAdapterProvider, useAui } from '@assistant-ui/react'
import { createAssistantStream } from 'assistant-stream'
import { type FC, type PropsWithChildren, useMemo } from 'react'

const PREFIX = 'clickhouse-agent:aui:'
const THREADS_KEY = `${PREFIX}threads`
const messagesKey = (remoteId: string) => `${PREFIX}messages:${remoteId}`

interface ThreadMeta {
  remoteId: string
  externalId?: string
  status: 'regular' | 'archived'
  title?: string
}

interface MessageRepo {
  messages: Array<{ message: { id: string; role?: string } }>
  headId?: string
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded / unavailable — fail silently, same as the old store.
  }
}

function removeKey(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Per-thread message history adapter. assistant-ui calls `load()` when a thread
 * becomes active and `append()` once per finalized message turn.
 */
class LocalHistoryAdapter {
  constructor(private readonly aui: ReturnType<typeof useAui>) {}

  async load(): Promise<MessageRepo> {
    const remoteId = this.aui.threadListItem().getState().remoteId
    if (!remoteId) return { messages: [] }
    return readJson<MessageRepo>(messagesKey(remoteId), { messages: [] })
  }

  async append(item: { message: { id: string } }): Promise<void> {
    const { remoteId } = await this.aui.threadListItem().initialize()
    const key = messagesKey(remoteId)
    const repo = readJson<MessageRepo>(key, { messages: [] })
    const index = repo.messages.findIndex(
      (entry) => entry.message.id === item.message.id
    )
    if (index >= 0) {
      repo.messages[index] = item as MessageRepo['messages'][number]
    } else {
      repo.messages.push(item as MessageRepo['messages'][number])
    }
    repo.headId = item.message.id
    writeJson(key, repo)
  }
}

const HistoryProvider: FC<PropsWithChildren> = ({ children }) => {
  const aui = useAui()
  const history = useMemo(() => new LocalHistoryAdapter(aui), [aui])
  const adapters = useMemo(() => ({ history }), [history])
  return (
    <RuntimeAdapterProvider adapters={adapters as never}>
      {children}
    </RuntimeAdapterProvider>
  )
}

/**
 * Build a `RemoteThreadListAdapter` that stores threads + messages in
 * `window.localStorage`.
 */
export function createLocalThreadListAdapter(): RemoteThreadListAdapter {
  const loadThreads = () => readJson<ThreadMeta[]>(THREADS_KEY, [])
  const saveThreads = (threads: ThreadMeta[]) => writeJson(THREADS_KEY, threads)

  return {
    unstable_Provider: HistoryProvider,

    async list() {
      return {
        threads: loadThreads().map((thread) => ({
          remoteId: thread.remoteId,
          externalId: thread.externalId,
          status: thread.status,
          title: thread.title,
        })),
      }
    },

    async initialize(threadId) {
      const threads = loadThreads()
      if (!threads.some((thread) => thread.remoteId === threadId)) {
        threads.unshift({ remoteId: threadId, status: 'regular' })
        saveThreads(threads)
      }
      return { remoteId: threadId, externalId: undefined }
    },

    async rename(remoteId, newTitle) {
      const threads = loadThreads()
      const thread = threads.find((item) => item.remoteId === remoteId)
      if (thread) {
        thread.title = newTitle
        saveThreads(threads)
      }
    },

    async archive(remoteId) {
      const threads = loadThreads()
      const thread = threads.find((item) => item.remoteId === remoteId)
      if (thread) {
        thread.status = 'archived'
        saveThreads(threads)
      }
    },

    async unarchive(remoteId) {
      const threads = loadThreads()
      const thread = threads.find((item) => item.remoteId === remoteId)
      if (thread) {
        thread.status = 'regular'
        saveThreads(threads)
      }
    },

    async delete(remoteId) {
      saveThreads(loadThreads().filter((item) => item.remoteId !== remoteId))
      removeKey(messagesKey(remoteId))
    },

    async fetch(threadId) {
      const thread = loadThreads().find((item) => item.remoteId === threadId)
      if (!thread) throw new Error('Thread not found')
      return {
        remoteId: thread.remoteId,
        externalId: thread.externalId,
        status: thread.status,
        title: thread.title,
      }
    },

    async generateTitle(remoteId) {
      // Title is derived from the first user message during persistence; no
      // LLM round-trip needed. Return an empty stream.
      void remoteId
      return createAssistantStream(() => {})
    },
  }
}
