'use client'

import { PanelRightClose, PanelRightOpen } from 'lucide-react'

import type { ConversationListItem } from './conversation-switcher'

import { AgentConfigGuidance } from './agent-config-guidance'
import { AgentsChatArea } from './agents-chat-area'
import { AgentsSidebar } from './agents-sidebar'
import { ConversationSwitcher } from './conversation-switcher'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversationContext } from '@/lib/agents/conversation-context'
import { useLLMConfig } from '@/lib/hooks/use-llm-config'
import { useHostId } from '@/lib/swr'

export function AgentsLayout() {
  const hostId = useHostId()
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Desktop open, mobile closed by default
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // md breakpoint
    }
    return true // SSR fallback
  })
  const {
    isConfigured,
    missingKeys,
    isLoading: isConfigLoading,
  } = useLLMConfig()

  // Get conversation state from context
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    deleteConversation,
    switchConversation,
  } = useConversationContext()

  // Convert full Conversation objects to ConversationListItem for the switcher
  const conversationList = useMemo<ConversationListItem[]>(
    () =>
      conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    [conversations]
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header with conversation switcher */}
        <div className="flex items-center gap-2 border-b px-3 sm:px-4 py-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8 shrink-0"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
          <ConversationSwitcher
            currentConversationId={currentConversationId}
            conversations={conversationList}
            onNew={createNewConversation}
            onSelect={switchConversation}
            onDelete={deleteConversation}
          />
        </div>

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
          hideHeader={true}
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