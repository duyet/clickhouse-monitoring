'use client'

/**
 * assistant-ui runtime for the ClickHouse agent.
 *
 * Replaces the hand-rolled `useChat` host in the old `agents-chat-area.tsx`:
 *
 * - `useChatRuntime` wraps the unchanged Vercel AI SDK v6 backend at
 *   `/api/v1/agent`, carrying the custom request body (`hostId`, `model`,
 *   `disabledTools`, `sessionId`) the route expects.
 * - `useRemoteThreadListRuntime` layers persistent conversation history on top,
 *   backed by either D1 or localStorage (see `resolve-thread-list-adapter`).
 */

import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { DefaultChatTransport } from 'ai'
import { type ReactNode, useMemo } from 'react'
import { resolveThreadListAdapter } from '@/lib/conversation-store/adapter/resolve-thread-list-adapter'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { apiFetch } from '@/lib/swr/api-fetch'
import { useHostId } from '@/lib/swr/use-host'

/**
 * Per-thread chat runtime. assistant-ui invokes this hook once per active
 * thread; it talks to the existing AI SDK v6 agent route.
 */
function useAgentChatRuntime() {
  const hostId = useHostId()
  const { disabledTools } = useToolConfig()
  const model = useMemo(() => getSavedModel(), [])
  const sessionId = useMemo(() => crypto.randomUUID(), [])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/v1/agent',
        fetch: apiFetch as typeof globalThis.fetch,
        body: { hostId, model, disabledTools, sessionId },
      }),
    [hostId, model, disabledTools, sessionId]
  )

  return useChatRuntime({ transport })
}

/**
 * Provides the agent runtime (chat + persistent thread list) to assistant-ui
 * components. Mounted once per surface — the full-page Thread and the global
 * floating modal each get an independent instance.
 */
export function AgentRuntimeProvider({ children }: { children: ReactNode }) {
  const adapter = useMemo(() => resolveThreadListAdapter(), [])

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useAgentChatRuntime,
    adapter,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
