'use client'

import { AgentConfigGuidance } from './agent-config-guidance'
import { AgentsChatArea } from './agents-chat-area'
import { AgentsSidebar } from './agents-sidebar'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLLMConfig } from '@/lib/hooks/use-llm-config'
import { useHostId } from '@/lib/swr'

export function AgentsLayout() {
  const hostId = useHostId()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const {
    isConfigured,
    missingKeys,
    isLoading: isConfigLoading,
  } = useLLMConfig()

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Config guidance (when missing) */}
        {!isConfigLoading && !isConfigured && (
          <div className="border-b p-4 shrink-0">
            <AgentConfigGuidance missingKeys={missingKeys} />
          </div>
        )}

        {/* Loading skeleton for config check */}
        {isConfigLoading && (
          <div className="border-b p-4 shrink-0">
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        <AgentsChatArea
          hostId={hostId}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* Right sidebar */}
      <AgentsSidebar
        hostId={hostId}
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
    </div>
  )
}
