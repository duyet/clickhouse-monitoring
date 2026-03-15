'use client'

import {
  ActivityIcon,
  AlertTriangleIcon,
  LayersIcon,
  MergeIcon,
} from 'lucide-react'

import type { ReactNode } from 'react'

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
  getSeverity: (value: number) => 'green' | 'amber' | 'red'
}

const INSIGHT_CARDS: InsightCardConfig[] = [
  {
    chartName: 'running-queries-count',
    label: 'Running Queries',
    icon: <ActivityIcon className="h-4 w-4" />,
    question: 'Which queries are running right now?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 50 ? 'red' : v > 10 ? 'amber' : 'green'),
  },
  {
    chartName: 'merge-active-count',
    label: 'Active Merges',
    icon: <MergeIcon className="h-4 w-4" />,
    question: 'How is the merge queue performing?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 20 ? 'red' : v > 5 ? 'amber' : 'green'),
  },
  {
    chartName: 'summary-stuck-mutations',
    label: 'Stuck Mutations',
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    question: 'Are there stuck mutations?',
    getValue: (data) => Number(data[0]?.count ?? 0),
    getSeverity: (v) => (v > 0 ? 'red' : 'green'),
  },
  {
    chartName: 'health-max-part-count',
    label: 'Max Part Count',
    icon: <LayersIcon className="h-4 w-4" />,
    question: 'Show tables with high part counts',
    getValue: (data) => Number(data[0]?.count ?? data[0]?.max_parts_count ?? 0),
    getSeverity: (v) => (v > 3000 ? 'red' : v > 300 ? 'amber' : 'green'),
  },
]

const SEVERITY_STYLES = {
  green:
    'border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400',
  amber:
    'border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400',
  red: 'border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400',
} as const

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
      <div className="rounded-lg border p-3 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-12" />
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <button
        onClick={() => onClick(config.question)}
        className="rounded-lg border border-dashed p-3 text-left opacity-60 hover:opacity-80 transition-opacity w-full"
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {config.icon}
          {config.label}
        </div>
        <div className="text-xs text-muted-foreground mt-1">unavailable</div>
      </button>
    )
  }

  const value = config.getValue(data as Record<string, unknown>[])
  const severity = config.getSeverity(value)

  return (
    <button
      onClick={() => onClick(config.question)}
      className={cn(
        'rounded-lg border p-3 text-left transition-all hover:shadow-sm hover:scale-[1.02] w-full',
        SEVERITY_STYLES[severity]
      )}
    >
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {config.icon}
        {config.label}
      </div>
      <div className="text-xl font-semibold mt-1 tabular-nums">
        {value.toLocaleString()}
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
