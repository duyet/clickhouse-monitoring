'use client'

import {
  ActivityIcon,
  CoinsIcon,
  MessageSquareIcon,
  ZapIcon,
} from 'lucide-react'

import type { UIMessage } from 'ai'

import { formatReadableQuantity } from '@/lib/format-readable'
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
 * Format a token count compactly (e.g. 1234 → "1.2K", 500 → "500")
 */
function formatTokens(count: number): string {
  return formatReadableQuantity(count)
}

/**
 * Format an estimated cost in USD.
 * Returns "Free" for $0, "$0.000X" for very small amounts, "$X.XX" otherwise.
 */
function formatCost(usd: number | null): string {
  if (usd === null) return '—'
  if (usd === 0) return 'Free'
  if (usd < 0.001) return `$${usd.toFixed(6)}`
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(3)}`
}

/**
 * Session Stats Display Component
 *
 * Shows aggregated statistics from the agent conversation:
 * - Total messages and requests
 * - Tool call count
 * - Token usage (input + output, compact format)
 * - Estimated cost in USD
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

      {/* Token usage */}
      <StatItem
        icon={ZapIcon}
        label="Tokens"
        value={
          stats.totalTokens > 0
            ? `${formatTokens(stats.totalInputTokens)} in / ${formatTokens(stats.totalOutputTokens)} out`
            : '—'
        }
      />

      {/* Estimated cost */}
      <StatItem
        icon={CoinsIcon}
        label="Est. Cost"
        value={formatCost(stats.estimatedCostUsd)}
      />
    </div>
  )
}
