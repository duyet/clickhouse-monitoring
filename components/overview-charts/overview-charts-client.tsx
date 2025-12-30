'use client'

import { memo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

  // Handle loading state for both queries
  if (databaseSwr.isLoading || tablesSwr.isLoading) {
    return <MetricCardSkeleton title="Database" description="Overview" />
  }

  // Handle error state
  if (databaseSwr.error || tablesSwr.error) {
    return (
      <MetricCardError
        error={
          databaseSwr.error || tablesSwr.error || new Error('Unknown error')
        }
        onRetry={() => {
          databaseSwr.refresh()
          tablesSwr.refresh()
        }}
        title="Database"
        description="Overview"
      />
    )
  }

  const dbArray = (Array.isArray(databaseSwr.data) ? databaseSwr.data : []) as {
    count: number
  }[]
  const tablesArray = (Array.isArray(tablesSwr.data) ? tablesSwr.data : []) as {
    count: number
  }[]

  return (
    <MetricCard
      swr={databaseSwr} // Pass first SWR for loading/error state handling
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

  // Show skeleton while loading
  if (hostNameSwr.isLoading || versionSwr.isLoading || uptimeSwr.isLoading) {
    return <MetricCardSkeleton title="System Info" description="ClickHouse" />
  }

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
      swr={hostNameSwr} // Use hostNameSwr for loading/error state
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

// Helper components for skeleton and error states
const MetricCardSkeleton = memo(function MetricCardSkeleton({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-sm"
      role="status"
      aria-label={`Loading ${title || 'metric'}`}
    >
      <CardHeader className="px-4 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            {title ? (
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </CardTitle>
            ) : (
              <Skeleton className="h-3 w-20" />
            )}
            {description ? (
              <CardDescription className="text-xs text-muted-foreground/70">
                {description}
              </CardDescription>
            ) : (
              <Skeleton className="h-2.5 w-14" />
            )}
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <Skeleton className="h-8 w-16" />
      </CardContent>
      <span className="sr-only">Loading {title || 'metric'} data...</span>
    </Card>
  )
})

const MetricCardError = memo(function MetricCardError({
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
    <Card
      className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-sm"
      role="alert"
      aria-label={`Error loading ${title || 'metric'}`}
    >
      <CardHeader className="px-4 pb-1 pt-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title || 'Error'}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs text-muted-foreground/70">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <div className="text-sm font-medium text-destructive">
            Connection Error
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {error.message}
          </div>
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
            aria-label="Retry loading data"
          >
            Retry
          </button>
        </div>
      </CardContent>
    </Card>
  )
})
