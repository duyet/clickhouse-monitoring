'use client'

import type { JSX } from 'react'

import { AgentsLayout } from '@/components/agents/agents-layout'
import { ConversationProvider } from '@/lib/ai/agent/conversation-context'

export function AgentsRuntime(): JSX.Element {
  return (
    <ConversationProvider>
      <div className="h-[calc(100dvh-4rem)] overflow-hidden">
        <AgentsLayout />
      </div>
    </ConversationProvider>
  )
}
