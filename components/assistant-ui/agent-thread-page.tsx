'use client'

/**
 * Full-page `/agents` experience: the persistent conversation rail
 * (`ThreadList`) alongside the assistant-ui `Thread`, wrapped in the agent
 * runtime. Replaces the old `agents-layout.tsx` + `agents-chat-area.tsx`.
 */

import { ErrorBoundary } from 'react-error-boundary'

import { AgentRuntimeProvider } from '@/components/assistant-ui/agent-runtime-provider'
import { Thread } from '@/components/assistant-ui/thread'
import { ThreadList } from '@/components/assistant-ui/thread-list'

function AgentThreadPageError() {
  return (
    <div className="bg-background flex h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-2 rounded-xl border text-center">
      <p className="text-sm font-medium">The agent failed to load.</p>
      <p className="text-muted-foreground max-w-sm text-xs">
        Reload the page to try again. If this keeps happening, check that the
        LLM provider is configured.
      </p>
    </div>
  )
}

export function AgentThreadPage() {
  return (
    <ErrorBoundary FallbackComponent={AgentThreadPageError}>
      <AgentRuntimeProvider>
        <div className="bg-background flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-xl border">
          <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2 lg:flex">
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
    </ErrorBoundary>
  )
}
