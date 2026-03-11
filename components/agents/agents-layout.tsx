'use client'

import { AgentsChatArea } from './agents-chat-area'
import { AgentsSidebar } from './agents-sidebar'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useHostId } from '@/lib/swr'

export function AgentsLayout() {
  const hostId = useHostId()
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AgentsChatArea
          hostId={hostId}
          isMobile={isMobile}
          onMenuClick={() => setIsSidebarOpen(true)}
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
