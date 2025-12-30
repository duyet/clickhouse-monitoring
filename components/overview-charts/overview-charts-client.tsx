'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MetricCard } from '@/components/charts/metric-card'
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
        <div className="flex items-center justify-between">
          <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
            {(data[0] as { count: number }).count}
          </div>
        </div>
      )}
    </MetricCard>
  )
}

function DatabaseTableCount({ hostId }: { hostId: number }) {
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

  // Handle loading state for both queries
  if (databaseSwr.isLoading || tablesSwr.isLoading) {
    return (
      <MetricCardSkeleton title="Database" description="Overview" />
    )
  }

  // Handle error state
  if (databaseSwr.error || tablesSwr.error) {
    return (
      <MetricCardError
        error={databaseSwr.error || tablesSwr.error || new Error('Unknown error')}
        onRetry={() => {
          databaseSwr.refresh()
          tablesSwr.refresh()
        }}
        title="Database"
        description="Overview"
      />
    )
  }

  const dbArray = (Array.isArray(databaseSwr.data) ? databaseSwr.data : []) as { count: number }[]
  const tablesArray = (Array.isArray(tablesSwr.data) ? tablesSwr.data : []) as { count: number }[]

  return (
    <MetricCard
      swr={databaseSwr} // Pass first SWR for loading/error state handling
      title="Database"
      description="Overview"
      viewAllHref={`/tables-overview?host=${hostId}`}
    >
      {() => (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm tabular-nums">
              {dbArray[0]?.count || 0} databases
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm tabular-nums">
              {tablesArray[0]?.count || 0} tables
            </span>
          </div>
        </div>
      )}
    </MetricCard>
  )
}

function ClickHouseInfo({ hostId }: { hostId: number }) {
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

  // Show skeleton while loading
  if (hostNameSwr.isLoading || versionSwr.isLoading || uptimeSwr.isLoading) {
    return <MetricCardSkeleton title="System Info" description="ClickHouse" />
  }

  const hostArray = (Array.isArray(hostNameSwr.data) ? hostNameSwr.data : []) as { val: string }[]
  const versionArray = (Array.isArray(versionSwr.data) ? versionSwr.data : []) as { val: string }[]
  const uptimeArray = (Array.isArray(uptimeSwr.data) ? uptimeSwr.data : []) as { val: string }[]

  return (
    <MetricCard
      swr={hostNameSwr} // Use hostNameSwr for loading/error state
      title="System Info"
      description="ClickHouse"
    >
      {() => (
        <div className="space-y-2">
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
        </div>
      )}
    </MetricCard>
  )
}

function DiskSize({ hostId }: { hostId: number }) {
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
      viewAllHref={`/disks?host=${hostId}`}
    >
      {(data) => {
        const first = data[0] as {
          name: string
          readable_used_space: string
          readable_total_space: string
        }
        return (
          <>
            <CardDescription className="text-xs">
              {first.readable_total_space} total ({first.name} disk)
            </CardDescription>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {first.readable_used_space} used
              </div>
            </div>
          </>
        )
      }}
    </MetricCard>
  )
}

// Helper components for skeleton and error states
function MetricCardSkeleton({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="rounded-md border">
      <div className="px-4 pb-1 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title ? (
              <div className="text-sm font-medium">{title}</div>
            ) : (
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            )}
            {description && <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />}
          </div>
          {title && <div className="h-4 w-16 animate-pulse rounded bg-muted" />}
        </div>
      </div>
      <div className="px-4 pt-0 pb-4">
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

function MetricCardError({
  error,
  onRetry,
  title,
  description,
}: {
  error: Error
  onRetry: () => void
  title?: string
  description?: string
}) {
  return (
    <div className="rounded-md border">
      <div className="px-4 pb-2 pt-4">
        <div className="text-sm font-medium">{title || 'Error'}</div>
        {description && <div className="text-muted-foreground mt-1 text-xs">{description}</div>}
      </div>
      <div className="px-4 pt-0 pb-4">
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <div className="text-destructive text-xs font-medium">Error loading data</div>
          <div className="text-muted-foreground mt-1 text-xs">{error.message}</div>
          <button
            onClick={onRetry}
            className="text-muted-foreground hover:text-foreground mt-2 text-xs underline"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}
