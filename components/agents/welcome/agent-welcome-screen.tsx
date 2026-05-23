'use client'

/**
 * AgentWelcomeScreen — chat-first welcome screen for the AI Agent page.
 *
 * Centred layout: sparkle icon + dynamic greeting, composer (assistant-ui
 * suggestion-friendly), skills capability grid, and a recent threads strip.
 * Replaces the old `ThreadWelcome` empty-state inside `thread.tsx`.
 *
 * The composer itself is still rendered by `thread.tsx` (so we don't
 * duplicate runtime wiring); this component is the surrounding shell.
 */

import { SparklesIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { RecentThreadsRail } from '@/components/agents/welcome/recent-threads-rail'
import { RecommendationsList } from '@/components/agents/welcome/recommendations-list'
import { useAgentGreeting } from '@/lib/hooks/use-agent-greeting'

interface AgentWelcomeScreenProps {
  /** First name to weave into the heading (e.g. from Clerk). */
  firstName?: string | null
  /** Cluster display name (e.g. "duet-ubuntu"). */
  clusterName?: string | null
  /** Flag for the heading's alert variant. */
  hasClusterIssue?: boolean
  /** Composer to render below the greeting — wired by the parent. */
  composer: ReactNode
  /** Number of currently active MCP tools, for the connection footer. */
  activeToolCount: number
  /** Called when the user picks a suggested prompt — fills the composer. */
  onPickPrompt?: (prompt: string) => void
}

export function AgentWelcomeScreen({
  firstName,
  clusterName,
  hasClusterIssue,
  composer,
  activeToolCount,
  onPickPrompt,
}: AgentWelcomeScreenProps) {
  const greeting = useAgentGreeting({
    firstName,
    hasClusterIssue,
    clusterName,
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-10 pb-6">
      {/* Greeting */}
      <div className="mb-8 text-center">
        <div className="bg-muted border-border mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border">
          <SparklesIcon className="text-foreground size-5" strokeWidth={1.6} />
        </div>
        <h1
          className={`text-[28px] font-semibold leading-tight tracking-tight ${
            greeting.tone === 'alert' ? 'text-foreground' : 'text-foreground'
          }`}
        >
          {greeting.heading}
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-[13.5px]">
          I’m wired into your ClickHouse cluster{' '}
          <span className="text-foreground font-mono">
            {clusterName ?? 'unknown'}
          </span>
          . Ask anything — schemas, queries, performance, health.
        </p>
      </div>

      {/* Composer (parent-owned) */}
      <div className="mb-8">{composer}</div>

      {/* Suggested questions */}
      <RecommendationsList onPickPrompt={onPickPrompt} />

      {/* Recent threads */}
      <RecentThreadsRail />

      {/* Footer status */}
      <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-center text-[10.5px]">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-70" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Connected to{' '}
        <span className="text-foreground font-mono">
          {clusterName ?? 'cluster'}
        </span>{' '}
        · {activeToolCount} tools active · messages saved locally
      </div>
    </div>
  )
}
