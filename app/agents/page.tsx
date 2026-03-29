'use client'

import dynamicModule from 'next/dynamic'
import { ConversationProvider } from '@/lib/ai/agent/conversation-context'

export const dynamic = 'force-static'

const AgentsLayout = dynamicModule(
  () => import('@/components/agents/agents-layout').then((m) => m.AgentsLayout),
  { ssr: false }
)

export default function AgentsPage() {
  return (
    <ConversationProvider>
      <div className="h-[calc(100dvh-4rem)] overflow-hidden">
        <AgentsLayout />
      </div>
    </ConversationProvider>
  )
}
