'use client'

import { memo } from 'react'
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

export const OverviewCharts = memo(function OverviewCharts({ hostId, className }: OverviewChartsProps) {
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

const RunningQueries = memo(function RunningQueries({ hostId }: { hostId: number }) {
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
        <div className="font-mono text-xl font-semibold tabular-nums tracking-tight">
          {(data[0] as { count: number }).count}
        </div>
      )}
    </MetricCard>
  )
})

const DatabaseTableCount = memo(function DatabaseTableCount({ hostId }: { hostId: number }) {
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
        <div className="space-y-1">
          <div className="font-mono text-xs tabular-nums">
            {dbArray[0]?.count || 0} databases
          </div>
          <div className="font-mono text-xs tabular-nums">
            {tablesArray[0]?.count || 0} tables
          </div>
        </div>
      )}
    </MetricCard>
  )
})

const ClickHouseInfo = memo(function ClickHouseInfo({ hostId }: { hostId: number }) {
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
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[10px]">Host</span>
            <div
              className="truncate text-xs font-medium"
              title={hostArray[0]?.val || ''}
            >
              {hostArray[0]?.val || '-'}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[10px]">Version</span>
            <div
              className="truncate text-xs font-medium"
              title={versionArray[0]?.val || ''}
            >
              {versionArray[0]?.val || '-'}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[10px]">Uptime</span>
            <div
              className="truncate text-xs font-medium"
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
            <CardDescription className="text-[10px]">
              {first.readable_total_space} total ({first.name} disk)
            </CardDescription>
            <div className="text-lg font-bold">
              {first.readable_used_space} used
            </div>
          </>
        )
      }}
    </MetricCard>
  )
})

// Helper components for skeleton and error states
// Matches MetricCard dimensions exactly to prevent CLS
const MetricCardSkeleton = memo(function MetricCardSkeleton({ title, description }: { title?: string; description?: string }) {
  return (
    <div
      className="rounded-md border border-border/50 bg-card/50 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] transition-all duration-200"
      role="status"
      aria-label={`Loading ${title || 'metric'}`}
      aria-busy="true"
    >
      {/* Header - matches MetricCard CardHeader px-3 pb-0 pt-2 */}
      <div className="px-3 pb-0 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {title ? (
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title}</div>
            ) : (
              <div className="h-2.5 w-16 animate-shimmer rounded bg-accent/50" />
            )}
            {description ? (
              <div className="text-muted-foreground mt-0.5 text-[10px]">{description}</div>
            ) : (
              <div className="mt-0.5 h-2 w-10 animate-shimmer rounded bg-accent/50" />
            )}
          </div>
          <div className="h-2 w-10 animate-shimmer rounded bg-accent/50" />
        </div>
      </div>
      {/* Content - matches MetricCard CardContent px-3 pt-1.5 pb-2.5 */}
      <div className="px-3 pt-1.5 pb-2.5">
        <div className="h-5 w-12 animate-shimmer rounded bg-accent/50" />
      </div>
      <span className="sr-only">Loading {title || 'metric'} data...</span>
    </div>
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
    <div
      className="rounded-md border border-border/50 bg-card/50 shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]"
      role="alert"
      aria-label={`Error loading ${title || 'metric'}`}
    >
      <div className="px-3 pb-0 pt-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title || 'Error'}</div>
        {description && <div className="text-muted-foreground mt-0.5 text-[10px]">{description}</div>}
      </div>
      <div className="px-3 pt-1.5 pb-2.5">
        <div className="rounded border border-destructive/20 bg-destructive/5 p-1.5">
          <div className="text-destructive text-[10px] font-medium">Error</div>
          <div className="text-muted-foreground text-[10px] truncate">{error.message}</div>
          <button
            onClick={onRetry}
            className="text-muted-foreground hover:text-foreground mt-1 text-[10px] underline transition-colors"
            aria-label="Retry loading data"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
})
