'use client'

/**
 * Full-page `/agents` experience.
 *
 * Three-column layout:
 *   1. Conversation rail (assistant-ui `ThreadList`, hidden < lg).
 *   2. Main column — welcome screen when empty, threaded messages otherwise.
 *   3. Agent-settings sidebar (host · model · MCP server · skills · prompts).
 *
 * The settings sidebar is collapsible; when closed an "Agent settings"
 * affordance sits over the main column so the user can reopen it.
 */

import { PanelRightOpenIcon } from 'lucide-react'

import { useUser } from '@clerk/nextjs'
import { ErrorBoundary } from 'react-error-boundary'
import { useState } from 'react'
import { AgentSettingsSidebar } from '@/components/agents/welcome/agent-settings-sidebar'
import { AgentRuntimeProvider } from '@/components/assistant-ui/agent-runtime-provider'
import { Thread } from '@/components/assistant-ui/thread'
import { ThreadList } from '@/components/assistant-ui/thread-list'
import { Button } from '@/components/ui/button'
import { useHostId } from '@/lib/swr/use-host'
import { useHosts } from '@/lib/swr/use-hosts'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useUser()
  const hostId = useHostId()
  const { hosts } = useHosts()
  const currentHost = hosts.find((h) => h.id === hostId)
  const clusterName = currentHost?.name ?? null
  const firstName =
    user?.firstName ??
    (user?.fullName ? user.fullName.split(' ')[0] : null) ??
    null

  return (
    <ErrorBoundary FallbackComponent={AgentThreadPageError}>
      <AgentRuntimeProvider>
        <div className="bg-background flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-xl border">
          {/* Conversation rail */}
          <aside className="bg-muted/30 hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2 lg:flex">
            <p className="text-muted-foreground px-2 pt-1 text-xs font-medium tracking-wide uppercase">
              Conversations
            </p>
            <ThreadList />
          </aside>

          {/* Main column */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            {!sidebarOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="absolute top-3 right-3 z-10 h-8 gap-1.5 px-2.5 text-[11.5px] whitespace-nowrap shadow-sm"
              >
                <PanelRightOpenIcon className="size-3.5" />
                Agent settings
              </Button>
            ) : null}
            <Thread firstName={firstName} clusterName={clusterName} />
          </div>

          {/* Settings sidebar */}
          <AgentSettingsSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            hostName={clusterName ?? 'duyet-agent'}
          />
        </div>
      </AgentRuntimeProvider>
    </ErrorBoundary>
  )
}
