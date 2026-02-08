'use client'

import {
  CheckCircledIcon,
  ClockIcon,
  CrossCircledIcon,
  QuestionMarkIcon,
} from '@radix-ui/react-icons'

import { SectionHeader } from '../section-header'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

export interface ClusterStatusProps {
  label: string
  value: string | number
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  href?: string
}

function ClusterStatusItem({ label, value, status, href }: ClusterStatusProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircledIcon,
      className: 'text-emerald-500 dark:text-emerald-400',
    },
    warning: {
      icon: ClockIcon,
      className: 'text-amber-500 dark:text-amber-400',
    },
    error: {
      icon: CrossCircledIcon,
      className: 'text-rose-500 dark:text-rose-400',
    },
    unknown: {
      icon: QuestionMarkIcon,
      className: 'text-muted-foreground',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  const content = (
    <div className="flex flex-1 flex-col items-center justify-center gap-2">
      <div className={cn('p-2 rounded-full', 'bg-foreground/[0.03]')}>
        <Icon className={cn('h-5 w-5', config.className)} />
      </div>
      <div className="text-center">
        <div className="font-mono text-lg font-semibold tabular-nums text-foreground/90 dark:text-foreground/80">
          {value}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-widest font-medium text-foreground/45">
          {label}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="flex-1 min-w-0 rounded-lg hover:bg-foreground/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {content}
      </Link>
    )
  }

  return <div className="flex-1 min-w-0">{content}</div>
}

/**
 * ClusterStatusCard - Large bento card showing cluster health status
 * Displays key health indicators with visual status icons
 */
export const ClusterStatusCard = memo(function ClusterStatusCard() {
  const hostId = useHostId()

  // Fetch running queries count
  const runningSwr = useChartData<{ count: number }>({
    chartName: 'running-queries-count',
    hostId,
    refreshInterval: 15000,
  })

  // Fetch today's query count
  const todaySwr = useChartData<{ count: number }>({
    chartName: 'query-count-today',
    hostId,
    refreshInterval: 120000,
  })

  // Fetch connection status
  const connectionsSwr = useChartData<{ count: number }>({
    chartName: 'connections-http',
    hostId,
    refreshInterval: 30000,
  })

  const runningCount = runningSwr.data?.[0]?.count ?? 0
  const todayCount = todaySwr.data?.[0]?.count ?? 0
  const connectionCount = connectionsSwr.data?.[0]?.count ?? 0

  const isLoading =
    runningSwr.isLoading || todaySwr.isLoading || connectionsSwr.isLoading

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <SectionHeader title="Cluster Status" />
        <div className="flex items-center justify-center flex-1">
          <div className="space-y-2 w-full">
            <div className="h-20 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
            <div className="flex gap-2">
              <div className="flex-1 h-20 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
              <div className="flex-1 h-20 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Cluster Status" />
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 [animation:pulse_2s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
          <span className="text-xs text-foreground/60">Online</span>
        </div>
      </div>

      {/* Status Items */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Main metric - Running Queries */}
        <div className="flex items-center justify-center p-3 rounded-lg bg-foreground/[0.02] border border-border/30">
          <div className="text-center">
            <AnimatedNumber
              value={runningCount}
              className="text-3xl font-mono font-semibold tabular-nums text-foreground/90"
            />
            <div className="mt-1 text-xs uppercase tracking-wider text-foreground/50">
              Running Queries
            </div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="flex gap-2">
          <ClusterStatusItem
            label="Today"
            value={todayCount}
            status="healthy"
            href={buildUrl('/query-history', { host: hostId })}
          />
          <ClusterStatusItem
            label="Connections"
            value={connectionCount}
            status="healthy"
            href={buildUrl('/overview', { host: hostId, tab: 'health' })}
          />
        </div>
      </div>
    </div>
  )
})
