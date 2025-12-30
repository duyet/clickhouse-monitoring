'use client'

import { memo } from 'react'

import { MetricCard, MetricIcons, type MetricListItem } from '@/components/charts/metric-card'
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
      theme="orange"
      icon={MetricIcons.Activity}
      variant="single"
      value={(data) => (data[0] as { count: number }).count}
      unit="queries"
      viewAllHref={`/running-queries?host=${hostId}`}
      viewAllLabel="View all"
      compact
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

  const dbArray = (Array.isArray(databaseSwr.data) ? databaseSwr.data : []) as {
    count: number
  }[]
  const tablesArray = (Array.isArray(tablesSwr.data) ? tablesSwr.data : []) as {
    count: number
  }[]

  return (
    <MetricCard
      swr={databaseSwr}
      title="Database"
      description="Overview"
      theme="blue"
      icon={MetricIcons.Database}
      variant="dual"
      value1={dbArray[0]?.count ?? 0}
      unit1="databases"
      value2={tablesArray[0]?.count ?? 0}
      unit2="tables"
      viewAllHref={`/tables-overview?host=${hostId}`}
      viewAllLabel="View all"
      compact
    />
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

  const items: MetricListItem[] = [
    { label: 'Host', value: hostArray[0]?.val || '-', format: 'mono' },
    { label: 'Version', value: versionArray[0]?.val || '-', format: 'truncate' },
    { label: 'Uptime', value: uptimeArray[0]?.val || '-', format: 'mono' },
  ]

  return (
    <MetricCard
      swr={hostNameSwr}
      title="System Info"
      description="ClickHouse"
      theme="purple"
      icon={MetricIcons.Info}
      variant="list"
      items={items}
      compact
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

  return (
    <MetricCard
      swr={swr}
      title="Disk Size"
      description="Total storage"
      theme="green"
      icon={MetricIcons.HardDrive}
      variant="subtitle"
      value={(data) => (data[0] as { readable_used_space: string }).readable_used_space}
      subtitle={(data) => {
        const first = data[0] as {
          name: string
          readable_total_space: string
        }
        return `of ${first.readable_total_space} • ${first.name}`
      }}
      viewAllHref={`/disks?host=${hostId}`}
      viewAllLabel="View all"
      compact
    />
  )
})
