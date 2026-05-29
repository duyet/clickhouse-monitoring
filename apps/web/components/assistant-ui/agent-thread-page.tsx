'use client'

/**
 * Full-page `/agents` experience.
 *
 * Three-column layout:
 *   1. Conversation rail (assistant-ui `ThreadList`) — collapsible, hidden by
 *      default. A toggle in the top-left of the main column re-opens it.
 *   2. Main column — welcome screen when empty, threaded messages otherwise.
 *   3. Agent-settings sidebar (host · model · MCP server · skills · prompts) —
 *      collapsible, open by default.
 *
 * Both sidebars surface a small "Show <sidebar>" affordance over the main
 * column when closed so the user can reopen them at any time.
 */

import { PanelLeftOpenIcon, PanelRightOpenIcon } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import { useEffect, useState } from 'react'
import { AgentSettingsSidebar } from '@/components/agents/welcome/agent-settings-sidebar'
import { AgentAuthGate } from '@/components/assistant-ui/agent-auth-gate'
import { AgentRuntimeProvider } from '@/components/assistant-ui/agent-runtime-provider'
import { Thread } from '@/components/assistant-ui/thread'
import { ThreadList } from '@/components/assistant-ui/thread-list'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'
import { useHostId } from '@/lib/swr/use-host'
import { useHosts } from '@/lib/swr/use-hosts'

/**
 * Clerk's `useUser()` throws unless a `<ClerkProvider />` is mounted, and that
 * provider is only rendered when `isClerkEnabled()` is true (see
 * `components/clerk/clerk-auth-provider.tsx`). Gate the hook behind the same
 * build-time constant so the agents page never calls `useUser()` when Clerk is
 * disabled — same lazy-require pattern as `components/nav-user.tsx`.
 */
const useClerkFirstName: () => string | null = isClerkEnabled()
  ? require('@/components/assistant-ui/use-clerk-first-name').useClerkFirstName
  : () => null

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
  const isMobile = useIsMobile()
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  useEffect(() => {
    setRightSidebarOpen(!isMobile)
  }, [isMobile])
  const firstName = useClerkFirstName()
  const hostId = useHostId()
  const { hosts } = useHosts()
  const currentHost = hosts.find((h) => h.id === hostId)
  const clusterName = currentHost?.name ?? null

  return (
    <ErrorBoundary FallbackComponent={AgentThreadPageError}>
      <AgentAuthGate>
        <AgentRuntimeProvider>
          <div className="bg-background flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-xl border">
            {/* Conversation rail */}
            {leftSidebarOpen ? (
              <aside className="bg-muted/30 hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2 lg:flex">
                <div className="flex items-center justify-between gap-2 px-2 pt-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Conversations
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLeftSidebarOpen(false)}
                    className="text-muted-foreground hover:text-foreground size-6 shrink-0"
                    aria-label="Hide conversations"
                  >
                    <PanelLeftOpenIcon className="size-3.5 rotate-180" />
                  </Button>
                </div>
                <ThreadList />
              </aside>
            ) : null}

            {/* Main column */}
            <div className="relative flex min-w-0 flex-1 flex-col">
              {!leftSidebarOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLeftSidebarOpen(true)}
                  className="absolute top-3 left-3 z-10 hidden h-8 gap-1.5 px-2.5 text-[11.5px] whitespace-nowrap lg:inline-flex"
                >
                  <PanelLeftOpenIcon className="size-3.5" />
                  Conversations
                </Button>
              ) : null}
              {!rightSidebarOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRightSidebarOpen(true)}
                  className="absolute top-3 right-3 z-10 h-8 gap-1.5 px-2.5 text-[11.5px] whitespace-nowrap"
                >
                  <PanelRightOpenIcon className="size-3.5" />
                  Agent settings
                </Button>
              ) : null}
              <Thread firstName={firstName} clusterName={clusterName} />
            </div>

            {/* Settings sidebar */}
            <AgentSettingsSidebar
              open={rightSidebarOpen}
              onClose={() => setRightSidebarOpen(false)}
              hostName={clusterName ?? 'duyet-agent'}
            />
          </div>
        </AgentRuntimeProvider>
      </AgentAuthGate>
    </ErrorBoundary>
  )
}
