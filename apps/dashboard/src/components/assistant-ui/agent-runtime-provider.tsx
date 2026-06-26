'use client'

/**
 * assistant-ui runtime for the ClickHouse agent.
 *
 * - `useChatRuntime` wraps the Vercel AI SDK backend at `/api/v1/agent`,
 *   carrying the custom request body (`hostId`, `model`, `disabledTools`,
 *   `sessionId`) the route expects.
 * - `useRemoteThreadListRuntime` layers persistent conversation history on top,
 *   backed by either D1 or localStorage (see `resolve-thread-list-adapter`).
 *
 * NOTE — dual-ai transport cast: `DefaultChatTransport` is from ai@7 (root).
 * `@assistant-ui/react-ai-sdk` still depends on `@ai-sdk/react@3` which bundles
 * ai@6 internally, so `UIMessageChunk` types diverge at the TypeScript level
 * (they're wire-compatible). The `as any` cast below is intentional until
 * @assistant-ui/react-ai-sdk ships a version targeting ai@7.
 */

import {
  AssistantRuntimeProvider,
  useRemoteThreadListRuntime,
} from '@assistant-ui/react'
import { useChatRuntime } from '@assistant-ui/react-ai-sdk'
import { DefaultChatTransport } from 'ai'
import { type ReactNode, useMemo } from 'react'
import { resolveThreadListAdapter } from '@/lib/conversation-store/adapter/resolve-thread-list-adapter'
import { useAgentModel } from '@/lib/hooks/use-agent-model'
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
  const { model } = useAgentModel()
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useChatRuntime({ transport: transport as any })
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
