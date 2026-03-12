'use client'

import { PanelRightClose, PanelRightOpen, TrashIcon } from 'lucide-react'

import type { ConversationListItem } from './conversation-switcher'

import { AgentConfigGuidance } from './agent-config-guidance'
import { AgentsChatArea, type AgentsChatAreaRef } from './agents-chat-area'
import { AgentsSidebar } from './agents-sidebar'
import { ConversationSwitcher } from './conversation-switcher'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { useLLMConfig } from '@/lib/hooks/use-llm-config'
import { useHostId } from '@/lib/swr'

export function AgentsLayout() {
  const hostId = useHostId()
  const isMobile = useIsMobile()

  // Ref for accessing chat area methods (clear messages)
  const chatAreaRef = useRef<AgentsChatAreaRef>(null)

  // Track if user manually toggled sidebar (to prevent auto-closing on resize)
  const userToggledRef = useRef(false)

  // Sidebar defaults to open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile)

  // Sync sidebar state with isMobile changes (only if user hasn't manually toggled)
  useEffect(() => {
    if (!userToggledRef.current) {
      setIsSidebarOpen(!isMobile)
    }
  }, [isMobile])
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
        <div className="flex items-center justify-between gap-2 border-b px-3 sm:px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ConversationSwitcher
              currentConversationId={currentConversationId}
              conversations={conversationList}
              onNew={createNewConversation}
              onSelect={switchConversation}
              onDelete={deleteConversation}
            />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold truncate text-sm">AI Agent</span>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                Host {hostId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear conversation button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chatAreaRef.current?.clearMessages()}
              className="h-8 w-8 shrink-0"
              title="Clear conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            {/* Sidebar toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                userToggledRef.current = true
                setIsSidebarOpen(!isSidebarOpen)
              }}
              className="h-8 w-8 shrink-0"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Config guidance (when missing) */}
        {!isConfigLoading && !isConfigured && (
          <div className="border-b p-4 shrink-0">
            <AgentConfigGuidance missingKeys={missingKeys} />
          </div>
        )}

        <AgentsChatArea
          ref={chatAreaRef}
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
