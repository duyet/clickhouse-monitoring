'use client'

import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  LayersIcon,
  MergeIcon,
} from 'lucide-react'

import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { cn } from '@/lib/utils'

interface InsightCardConfig {
  chartName: string
  label: string
  icon: ReactNode
  question: string
  getValue: (data: Record<string, unknown>[]) => number
  getSeverity: (value: number) => 'healthy' | 'watch' | 'critical'
}

const INSIGHT_CARDS: InsightCardConfig[] = [
  {
    chartName: 'running-queries-count',
    label: 'Running Queries',
    icon: <ActivityIcon className="h-4 w-4" />,
    question: 'Which queries are running right now?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 50 ? 'critical' : v > 10 ? 'watch' : 'healthy'),
  },
  {
    chartName: 'merge-active-count',
    label: 'Active Merges',
    icon: <MergeIcon className="h-4 w-4" />,
    question: 'How is the merge queue performing?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 20 ? 'critical' : v > 5 ? 'watch' : 'healthy'),
  },
  {
    chartName: 'summary-stuck-mutations',
    label: 'Stuck Mutations',
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    question: 'Are there stuck mutations?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 0 ? 'critical' : 'healthy'),
  },
  {
    chartName: 'health-max-part-count',
    label: 'Max Part Count',
    icon: <LayersIcon className="h-4 w-4" />,
    question: 'Show tables with high part counts',
    getValue: (data) => Number(data[0]?.count ?? data[0]?.max_parts_count ?? 0),
    getSeverity: (v) => (v > 3000 ? 'critical' : v > 300 ? 'watch' : 'healthy'),
  },
]

const SEVERITY_META = {
  healthy: {
    label: 'Healthy',
    dotClassName: 'bg-emerald-500',
    badgeClassName:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  watch: {
    label: 'Watch',
    dotClassName: 'bg-amber-500',
    badgeClassName:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  critical: {
    label: 'Attention',
    dotClassName: 'bg-rose-500',
    badgeClassName:
      'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
} as const

const ICON_CONTAINER_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-foreground/80'

function InsightCard({
  config,
  hostId,
  onClick,
}: {
  config: InsightCardConfig
  hostId: number
  onClick: (question: string) => void
}) {
  const { data, isLoading, error } = useChartData({
    chartName: config.chartName,
    hostId,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <button
        onClick={() => onClick(config.question)}
        className="group w-full rounded-2xl border border-dashed border-border/70 bg-card/60 p-4 text-left transition-colors hover:border-border hover:bg-accent/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={ICON_CONTAINER_CLASS}>{config.icon}</span>
              <span>{config.label}</span>
            </div>
            <div className="text-sm font-medium text-foreground">
              Data unavailable
            </div>
            <div className="text-xs text-muted-foreground">
              Ask the agent to inspect this area directly.
            </div>
          </div>
          <ArrowRightIcon className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    )
  }

  const value = config.getValue(data as Record<string, unknown>[])
  const severity = config.getSeverity(value)
  const severityMeta = SEVERITY_META[severity]

  return (
    <button
      onClick={() => onClick(config.question)}
      className={cn(
        'group w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-sm transition-all hover:border-border hover:bg-accent/25'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className={ICON_CONTAINER_CLASS}>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'rounded-full px-2 py-0 text-[10px] font-medium',
            severityMeta.badgeClassName
          )}
        >
          <span
            className={cn(
              'mr-1 inline-block h-1.5 w-1.5 rounded-full',
              severityMeta.dotClassName
            )}
          />
          {severityMeta.label}
        </Badge>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {value.toLocaleString()}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="line-clamp-2">{config.question}</span>
        <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}

export function AgentInsightCards({
  onQuestionClick,
}: {
  onQuestionClick: (question: string) => void
}) {
  const hostId = useHostId()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {INSIGHT_CARDS.map((config) => (
        <InsightCard
          key={config.chartName}
          config={config}
          hostId={hostId}
          onClick={onQuestionClick}
        />
      ))}
    </div>
  )
}
