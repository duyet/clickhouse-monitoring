'use client'

import {
  ActivityIcon,
  ClockIcon,
  MessageSquareIcon,
  ZapIcon,
} from 'lucide-react'

import type { AgentMessage } from '@/lib/agents/state'

import {
  formatDuration,
  formatModelName,
  useAgentSessionStats,
} from '@/lib/hooks/use-agent-session-stats'

export interface SessionStatsProps {
  /** Agent message history */
  readonly messages: readonly AgentMessage[]
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
 * - Model used
 * - Total iterations
 * - Average duration
 * - Request count
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
      {/* Model */}
      {stats.model && (
        <StatItem
          icon={ZapIcon}
          label="Model"
          value={formatModelName(stats.model)}
        />
      )}

      {/* Iterations */}
      <StatItem
        icon={ActivityIcon}
        label="Total Iterations"
        value={stats.totalIterations}
      />

      {/* Duration */}
      <StatItem
        icon={ClockIcon}
        label="Avg Duration"
        value={formatDuration(stats.avgDuration)}
      />

      {/* Request count */}
      <StatItem
        icon={MessageSquareIcon}
        label="Requests"
        value={stats.requestCount}
      />
    </div>
  )
}
