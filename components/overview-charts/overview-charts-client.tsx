'use client'

import { ErrorAlert } from '@/components/error-alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useChartData } from '@/lib/swr/use-chart-data'
import { cn } from '@/lib/utils'

interface OverviewChartsProps {
  hostId: number
  className?: string
}

export function OverviewCharts({ hostId, className }: OverviewChartsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3',
        'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      <RunningQueries hostId={hostId} />
      <DatabaseTableCount hostId={hostId} />
      <ClickHouseInfo hostId={hostId} />
      <DiskSize hostId={hostId} />
    </div>
  )
}

function RunningQueries({ hostId }: { hostId: number }) {
  const { data, error } = useChartData<{ count: number }[]>({
    chartName: 'running-queries-count',
    hostId,
    refreshInterval: 30000,
  })

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Running Queries</CardTitle>
          <CardDescription className="text-xs">Active</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={error.message}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  const dataArray = ((Array.isArray(data) ? data : []) as unknown) as { count: number }[]
  if (!dataArray.length) return <div />

  return (
    <Card>
      <CardHeader className="px-4 pb-1 pt-4">
        <CardTitle className="text-sm">Running Queries</CardTitle>
        <CardDescription className="text-xs">Active</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">{dataArray[0].count}</div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/running-queries?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

function DatabaseTableCount({ hostId }: { hostId: number }) {
  const { data: databaseData, error: databaseError } = useChartData<
    { count: number }[]
  >({ chartName: 'database-count', hostId, refreshInterval: 30000 })
  const { data: tablesData, error: tablesError } = useChartData<
    { count: number }[]
  >({ chartName: 'table-count', hostId, refreshInterval: 30000 })

  if (databaseError || tablesError) {
    return (
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Database</CardTitle>
          <CardDescription className="text-xs">Overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={
              databaseError?.message || tablesError?.message || 'Unknown error'
            }
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  const dbArray = ((Array.isArray(databaseData) ? databaseData : []) as unknown) as { count: number }[]
  const tablesArray = ((Array.isArray(tablesData) ? tablesData : []) as unknown) as { count: number }[]

  return (
    <Card>
      <CardHeader className="px-4 pb-1 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Database</CardTitle>
            <CardDescription className="text-xs">Overview</CardDescription>
          </div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/tables-overview?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm tabular-nums">
            {dbArray[0]?.count || 0} databases
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm tabular-nums">{tablesArray[0]?.count || 0} tables</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ClickHouseInfo({ hostId }: { hostId: number }) {
  const { data: hostNameData } = useChartData<{ val: string }[]>({
    chartName: 'hostname',
    hostId,
    refreshInterval: 30000,
  })
  const { data: versionData } = useChartData<{ val: string }[]>({
    chartName: 'version',
    hostId,
    refreshInterval: 30000,
  })
  const { data: uptimeData } = useChartData<{ val: string }[]>({
    chartName: 'uptime-readable',
    hostId,
    refreshInterval: 30000,
  })

  const hostArray = ((Array.isArray(hostNameData) ? hostNameData : []) as unknown) as { val: string }[]
  const versionArray = ((Array.isArray(versionData) ? versionData : []) as unknown) as { val: string }[]
  const uptimeArray = ((Array.isArray(uptimeData) ? uptimeData : []) as unknown) as { val: string }[]

  return (
    <Card>
      <CardHeader className="px-4 pb-1 pt-4">
        <CardTitle className="text-sm">System Info</CardTitle>
        <CardDescription className="text-xs">ClickHouse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Host</span>
          <div
            className="truncate text-sm font-medium"
            title={hostArray[0]?.val || ''}
          >
            {hostArray[0]?.val || '-'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Version</span>
          <div
            className="truncate text-sm font-medium"
            title={versionArray[0]?.val || ''}
          >
            {versionArray[0]?.val || '-'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Uptime</span>
          <div
            className="truncate text-sm font-medium"
            title={uptimeArray[0]?.val || ''}
          >
            {uptimeArray[0]?.val || '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DiskSize({ hostId }: { hostId: number }) {
  const { data, error } = useChartData<
    {
      name: string
      used_space: number
      readable_used_space: string
      total_space: number
      readable_total_space: string
    }[]
  >({ chartName: 'disk-size-single', hostId, refreshInterval: 30000 })

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Disk Size</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={error.message}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  const dataArray = ((Array.isArray(data) ? data : []) as unknown) as {
    name: string
    used_space: number
    readable_used_space: string
    total_space: number
    readable_total_space: string
  }[]
  if (!dataArray.length) return <div />

  const first = dataArray[0]

  return (
    <Card>
      <CardHeader className="px-4 pb-1 pt-4">
        <div>
          <CardTitle className="text-sm">Disk Size</CardTitle>
          <CardDescription className="text-xs">
            {first.readable_total_space} total ({first.name} disk)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {first.readable_used_space} used
          </div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/disks?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
