'use client'

import { memo } from 'react'
import { ActivityIcon, DatabaseIcon, HardDriveIcon, InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildUrl } from '@/lib/url/url-builder'
import { useChartData } from '@/lib/swr/use-chart-data'

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
        'grid grid-cols-2 gap-2',
        'sm:grid-cols-4',
        className
      )}
      role="region"
      aria-label="Overview metrics"
    >
      <RunningQueries hostId={hostId} />
      <DatabaseTableCount hostId={hostId} />
      <ClickHouseInfo hostId={hostId} />
      <DiskSize hostId={hostId} />
    </div>
  )
})

// ============================================================================
// Stat Block Component
// ============================================================================

interface StatBlockProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  href?: string
}

const StatBlock = memo(function StatBlock({
  icon,
  label,
  value,
  href,
}: StatBlockProps) {
  const content = (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card min-h-[64px]">
      {/* Icon */}
      <div className="shrink-0 text-muted-foreground">
        {icon}
      </div>

      {/* Value + Label */}
      <div className="min-w-0 flex-1">
        <div className="font-mono text-lg font-semibold tabular-nums truncate">
          {value}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {label}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href} className="hover:bg-accent/50 rounded-lg transition-colors">{content}</a>
  }
  return content
})

// ============================================================================
// Individual Stats
// ============================================================================

const RunningQueries = memo(function RunningQueries({
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

  return (
    <StatBlock
      icon={<ActivityIcon className="size-4" strokeWidth={2.5} />}
      label="Running Queries"
      value={count}
      href={buildUrl('/running-queries', { host: hostId })}
    />
  )
})

const DatabaseTableCount = memo(function DatabaseTableCount({
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
    <StatBlock
      icon={<DatabaseIcon className="size-4" strokeWidth={2.5} />}
      label="Databases / Tables"
      value={`${dbCount} / ${tableCount}`}
      href={buildUrl('/tables-overview', { host: hostId })}
    />
  )
})

const ClickHouseInfo = memo(function ClickHouseInfo({
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
    <StatBlock
      icon={<InfoIcon className="size-4" strokeWidth={2.5} />}
      label="ClickHouse Version"
      value={version}
    />
  )
})

const DiskSize = memo(function DiskSize({ hostId }: { hostId: number }) {
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

  const used = swr.data?.[0]?.readable_used_space ?? '-'

  return (
    <StatBlock
      icon={<HardDriveIcon className="size-4" strokeWidth={2.5} />}
      label="Disk Used"
      value={used}
      href={buildUrl('/disks', { host: hostId })}
    />
  )
})
