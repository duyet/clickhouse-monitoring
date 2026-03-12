'use client'

import { Suspense } from 'react'
import { AgentsLayout } from '@/components/agents/agents-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationProvider } from '@/lib/ai/agent/conversation-context'

function AgentsSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      <div className="flex-1 flex flex-col p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="flex-1 w-full" />
      </div>
      <div className="w-80 border-l p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<AgentsSkeleton />}>
      <ConversationProvider>
        <div className="h-[calc(100dvh-4rem)] overflow-hidden">
          <AgentsLayout />
        </div>
      </ConversationProvider>
    </Suspense>
  )
}
