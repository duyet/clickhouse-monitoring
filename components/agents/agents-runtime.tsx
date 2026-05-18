'use client'

import type { JSX } from 'react'

import { AgentsLayout } from '@/components/agents/agents-layout'
import { ConversationProvider } from '@/lib/ai/agent/conversation-context'

export function AgentsRuntime(): JSX.Element {
  return (
    <ConversationProvider>
      <div className="min-h-0 h-[calc(100dvh_-_6rem)] overflow-hidden">
        <AgentsLayout />
      </div>
    </ConversationProvider>
  )
}
