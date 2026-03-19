'use client'

import { PanelRightClose, PanelRightOpen, TrashIcon } from 'lucide-react'

import type { ConversationListItem } from './conversation-switcher'

import { AgentConfigGuidance } from './agent-config-guidance'
import { AgentsChatArea } from './agents-chat-area'
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

  // Track if user manually toggled sidebar (to prevent auto-closing on resize)
  const userToggledRef = useRef(false)

  // Sidebar defaults to open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile)

  // Track if user dismissed the config guidance
  const [isConfigGuidanceDismissed, setIsConfigGuidanceDismissed] =
    useState(false)

  // Ref to access child component's handleClear function
  const chatAreaRef = useRef<{ handleClear: () => void } | null>(null)

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
          <ConversationSwitcher
            currentConversationId={currentConversationId}
            conversations={conversationList}
            onNew={createNewConversation}
            onSelect={switchConversation}
            onDelete={deleteConversation}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chatAreaRef.current?.handleClear()}
              className="h-8 w-8 shrink-0"
              title="Clear conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                userToggledRef.current = true
                setIsSidebarOpen(!isSidebarOpen)
              }}
              className="h-9 gap-2 rounded-full px-3 shadow-sm"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSidebarOpen ? 'Hide sidebar' : 'Open sidebar'}
              </span>
            </Button>
          </div>
        </div>

        {/* Config guidance (when missing and not dismissed) */}
        {!isConfigLoading && !isConfigured && !isConfigGuidanceDismissed && (
          <div className="border-b p-4 shrink-0">
            <AgentConfigGuidance
              missingKeys={missingKeys}
              onDismiss={() => setIsConfigGuidanceDismissed(true)}
            />
          </div>
        )}

        <AgentsChatArea
          ref={chatAreaRef}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          hideHeader={true}
          hideCompactControls={true}
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
