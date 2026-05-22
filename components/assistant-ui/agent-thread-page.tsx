'use client'

/**
 * Full-page `/agents` experience: the persistent conversation rail
 * (`ThreadList`) alongside the assistant-ui `Thread`, wrapped in the agent
 * runtime. Replaces the old `agents-layout.tsx` + `agents-chat-area.tsx`.
 */

import { AgentRuntimeProvider } from './agent-runtime-provider'
import { Thread } from './thread'
import { ThreadList } from './thread-list'

export function AgentThreadPage() {
  return (
    <AgentRuntimeProvider>
      <div className="bg-background flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-xl border">
        <aside className="bg-mu/30 hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2 lg:flex">
          <p className="text-muted-foreground px-2 pt-1 text-xs font-medium tracking-wide uppercase">
            Conversations
          </p>
          <ThreadList />
        </aside>
        <div className="min-w-0 flex-1">
          <Thread />
        </div>
      </div>
    </AgentRuntimeProvider>
  )
}
