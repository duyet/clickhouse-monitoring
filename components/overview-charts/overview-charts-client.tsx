'use client'

import { memo } from 'react'

import { MetricCard } from '@/components/charts/metric-card'
import { useChartData } from '@/lib/swr/use-chart-data'
import { cn } from '@/lib/utils'

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
        'grid grid-cols-1 gap-2',
        'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
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

  return (
    <MetricCard
      swr={swr}
      title="Running Queries"
      description="Active"
      viewAllHref={`/running-queries?host=${hostId}`}
    >
      {(data) => (
        <div className="font-mono text-3xl font-bold tabular-nums tracking-tight">
          {(data[0] as { count: number }).count}
        </div>
      )}
    </MetricCard>
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

  // Use databaseSwr for base loading/error state, but show combined data
  const dbArray = (Array.isArray(databaseSwr.data) ? databaseSwr.data : []) as {
    count: number
  }[]
  const tablesArray = (Array.isArray(tablesSwr.data) ? tablesSwr.data : []) as {
    count: number
  }[]

  return (
    <MetricCard
      swr={databaseSwr} // Use for loading/error state handling
      title="Database"
      description="Overview"
      viewAllHref={`/tables-overview?host=${hostId}`}
    >
      {() => (
        <div className="flex items-baseline gap-4">
          <div>
            <span className="font-mono text-3xl font-bold tabular-nums">
              {dbArray[0]?.count || 0}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">
              databases
            </span>
          </div>
          <div>
            <span className="font-mono text-3xl font-bold tabular-nums">
              {tablesArray[0]?.count || 0}
            </span>
            <span className="ml-1.5 text-sm text-muted-foreground">tables</span>
          </div>
        </div>
      )}
    </MetricCard>
  )
})

const ClickHouseInfo = memo(function ClickHouseInfo({
  hostId,
}: {
  hostId: number
}) {
  const hostNameSwr = useChartData<{ val: string }>({
    chartName: 'hostname',
    hostId,
    refreshInterval: 30000,
  })
  const versionSwr = useChartData<{ val: string }>({
    chartName: 'version',
    hostId,
    refreshInterval: 30000,
  })
  const uptimeSwr = useChartData<{ val: string }>({
    chartName: 'uptime-readable',
    hostId,
    refreshInterval: 30000,
  })

  const hostArray = (
    Array.isArray(hostNameSwr.data) ? hostNameSwr.data : []
  ) as { val: string }[]
  const versionArray = (
    Array.isArray(versionSwr.data) ? versionSwr.data : []
  ) as { val: string }[]
  const uptimeArray = (Array.isArray(uptimeSwr.data) ? uptimeSwr.data : []) as {
    val: string
  }[]

  return (
    <MetricCard
      swr={hostNameSwr} // Use for loading/error state handling
      title="System Info"
      description="ClickHouse"
    >
      {() => (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Host</span>
            <div
              className="truncate font-mono text-sm font-medium"
              title={hostArray[0]?.val || ''}
            >
              {hostArray[0]?.val || '-'}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Version</span>
            <div
              className="truncate font-mono text-sm font-medium"
              title={versionArray[0]?.val || ''}
            >
              {versionArray[0]?.val || '-'}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Uptime</span>
            <div
              className="truncate font-mono text-sm font-medium"
              title={uptimeArray[0]?.val || ''}
            >
              {uptimeArray[0]?.val || '-'}
            </div>
          </div>
        </div>
      )}
    </MetricCard>
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

  return (
    <MetricCard
      swr={swr}
      title="Disk Size"
      description={`Total storage`}
      viewAllHref={`/disks?host=${hostId}`}
    >
      {(data) => {
        const first = data[0] as {
          name: string
          readable_used_space: string
          readable_total_space: string
        }
        return (
          <div>
            <div className="font-mono text-2xl font-bold tabular-nums tracking-tight">
              {first.readable_used_space}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              of {first.readable_total_space} ({first.name})
            </div>
          </div>
        )
      }}
    </MetricCard>
  )
})
