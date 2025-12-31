'use client'

import { memo } from 'react'
import { ActivityIcon, DatabaseIcon, HardDriveIcon, InfoIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildUrl } from '@/lib/url/url-builder'
import { useChartData } from '@/lib/swr/use-chart-data'
import { Progress } from '@/components/ui/progress'

interface OverviewChartsProps {
  hostId: number
  className?: string
}

export const OverviewCharts = memo(function OverviewCharts({
  hostId,
  className,
}: OverviewChartsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:gap-3',
        'sm:grid-cols-4',
        className
      )}
      role="region"
      aria-label="Overview metrics"
    >
      <RunningQueriesCard hostId={hostId} />
      <DatabaseTableCountCard hostId={hostId} />
      <DiskSizeCard hostId={hostId} />
      <ClickHouseInfoCard hostId={hostId} />
    </div>
  )
})

// ============================================================================
// Compact Stat Card Component
// ============================================================================

interface CompactStatCardProps {
  icon: React.ReactNode
  title: string
  value: React.ReactNode
  subtitle?: string
  href?: string
  progress?: number
  progressLabel?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const CompactStatCard = memo(function CompactStatCard({
  icon,
  title,
  value,
  subtitle,
  href,
  progress,
  progressLabel,
  variant = 'default',
}: CompactStatCardProps) {
  const variantStyles = {
    default: 'border-border bg-card',
    success: 'border-emerald-500/30 bg-emerald-950/10 dark:bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-950/10 dark:bg-amber-500/5',
    danger: 'border-rose-500/30 bg-rose-950/10 dark:bg-rose-500/5',
  }

  const progressColor = {
    default: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-3 transition-all',
        variantStyles[variant],
        href && 'hover:shadow-md hover:border-primary/50'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="shrink-0 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="font-mono text-xl font-bold tabular-nums truncate">
            {value}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {title}
          </div>
        </div>
      </div>

      {/* Subtitle / Progress */}
      {progress !== undefined ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressLabel}</span>
            <span className="font-medium tabular-nums">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : subtitle ? (
        <div className="mt-3 text-xs text-muted-foreground truncate">
          {subtitle}
        </div>
      ) : null}
    </div>
  )

  if (href) {
    return <a href={href} className="block">{content}</a>
  }
  return content
})

// ============================================================================
// Individual Cards
// ============================================================================

const RunningQueriesCard = memo(function RunningQueriesCard({
  hostId,
}: {
  hostId: number
}) {
  const swr = useChartData<{ count: number }>({
    chartName: 'running-queries-count',
    hostId,
    refreshInterval: 30000,
  })

  const count = swr.data?.[0]?.count ?? 0
  const isHigh = count > 100

  return (
    <CompactStatCard
      icon={<ActivityIcon className="size-4" strokeWidth={2.5} />}
      title="Running Queries"
      value={count}
      href={buildUrl('/running-queries', { host: hostId })}
      variant={isHigh ? 'warning' : 'default'}
      subtitle={isHigh ? 'High query load' : 'Active now'}
    />
  )
})

const DatabaseTableCountCard = memo(function DatabaseTableCountCard({
  hostId,
}: {
  hostId: number
}) {
  const databaseSwr = useChartData<{ count: number }>({
    chartName: 'database-count',
    hostId,
    refreshInterval: 30000,
  })
  const tablesSwr = useChartData<{ count: number }>({
    chartName: 'table-count',
    hostId,
    refreshInterval: 30000,
  })

  const dbCount = databaseSwr.data?.[0]?.count ?? 0
  const tableCount = tablesSwr.data?.[0]?.count ?? 0

  return (
    <CompactStatCard
      icon={<DatabaseIcon className="size-4" strokeWidth={2.5} />}
      title="Tables"
      value={tableCount}
      subtitle={`${dbCount} databases`}
      href={buildUrl('/tables-overview', { host: hostId })}
    />
  )
})

const DiskSizeCard = memo(function DiskSizeCard({
  hostId,
}: {
  hostId: number
}) {
  const swr = useChartData<{
    name: string
    used_space: number
    readable_used_space: string
    total_space: number
    readable_total_space: string
  }>({
    chartName: 'disk-size-single',
    hostId,
    refreshInterval: 30000,
  })

  const used = swr.data?.[0]?.used_space ?? 0
  const total = swr.data?.[0]?.total_space ?? 1
  const readableUsed = swr.data?.[0]?.readable_used_space ?? '-'
  const percent = total > 0 ? (used / total) * 100 : 0

  const variant = percent > 90 ? 'danger' : percent > 75 ? 'warning' : 'default'

  return (
    <CompactStatCard
      icon={<HardDriveIcon className="size-4" strokeWidth={2.5} />}
      title="Disk Used"
      value={readableUsed}
      href={buildUrl('/disks', { host: hostId })}
      variant={variant}
      progress={percent}
      progressLabel="of total"
    />
  )
})

const ClickHouseInfoCard = memo(function ClickHouseInfoCard({
  hostId,
}: {
  hostId: number
}) {
  const versionSwr = useChartData<{ val: string }>({
    chartName: 'version',
    hostId,
    refreshInterval: 30000,
  })

  const version = versionSwr.data?.[0]?.val ?? '-'

  return (
    <CompactStatCard
      icon={<InfoIcon className="size-4" strokeWidth={2.5} />}
      title="Version"
      value={version}
    />
  )
})
