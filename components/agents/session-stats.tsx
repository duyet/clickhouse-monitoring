'use client'

import { ActivityIcon, MessageSquareIcon } from 'lucide-react'

import type { UIMessage } from 'ai'

import { useAgentSessionStats } from '@/lib/hooks/use-agent-session-stats'

export interface SessionStatsProps {
  /** AI SDK message history */
  readonly messages: readonly UIMessage[]
}

/**
 * Stat item component for displaying a single metric
 */
function StatItem({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: React.ComponentType<{ readonly className?: string }>
  readonly label: string
  readonly value: string | number
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

/**
 * Session Stats Display Component
 *
 * Shows aggregated statistics from the agent conversation:
 * - Total messages
 * - Request count
 * - Tool call count
 *
 * @example
 * ```tsx
 * <SessionStats messages={messages} />
 * ```
 */
export function SessionStats({ messages }: SessionStatsProps) {
  const stats = useAgentSessionStats(messages)

  // Don't show if no requests yet
  if (stats.requestCount === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No session data yet. Send a message to see stats.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Messages */}
      <StatItem
        icon={MessageSquareIcon}
        label="Messages"
        value={stats.totalMessages}
      />

      {/* Requests */}
      <StatItem
        icon={MessageSquareIcon}
        label="Requests"
        value={stats.requestCount}
      />

      {/* Tool calls */}
      <StatItem
        icon={ActivityIcon}
        label="Tool Calls"
        value={stats.toolCallCount}
      />
    </div>
  )
}
