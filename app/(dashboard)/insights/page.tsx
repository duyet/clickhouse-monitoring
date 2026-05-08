'use client'

import { createBarChart } from '@/components/charts/factory'
import { LazyChartWrapper } from '@/components/charts/lazy-chart-wrapper'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { formatDuration } from '@/lib/utils'

// Helper: format date for subtitle display
function formatDay(day: string | Date): string {
  return new Date(day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Create bar chart components for insights with date range support
const TopTablesBySizeChart = createBarChart({
  chartName: 'insight-top-tables-by-size',
  index: 'table',
  categories: ['bytes'],
  defaultTitle: 'Top 10 Tables by Size',
  dateRangeConfig: 'insights',
  defaultLastHours: undefined, // All time by default
})

const CompressionRatiosChart = createBarChart({
  chartName: 'insight-compression-ratios',
  index: 'table',
  categories: ['compression_ratio'],
  defaultTitle: 'Best Compression Ratios',
  dateRangeConfig: 'insights',
  defaultLastHours: undefined, // All time by default
})

export default function InsightsPage() {
  const hostId = useHostId()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cluster Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record-breaking queries, storage statistics, and performance
          highlights
        </p>
      </div>
      <StatsGrid hostId={hostId} />
      <ChartsSection hostId={hostId} />
    </div>
  )
}

function StatCardView({
  title,
  value,
  subtitle,
}: {
  readonly title: string
  readonly value: string
  readonly subtitle?: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight">{value}</div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-6 w-28 animate-pulse rounded bg-muted" />
    </div>
  )
}

function StatEmpty({ title }: { readonly title: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground/60">No data</div>
    </div>
  )
}

function LargestScanStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-largest-scan',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Largest Scan" />
  const d = data[0]
  return (
    <StatCardView
      title="Largest Scan"
      value={String(d.readable_bytes)}
      subtitle={`${d.readable_rows} in ${Number(d.query_duration_ms).toLocaleString()}ms`}
    />
  )
}

function FastestScanStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-fastest-scan',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Fastest Scan Speed" />
  return (
    <StatCardView
      title="Fastest Scan Speed"
      value={`${String(data[0].readable_speed)}/s`}
    />
  )
}

function LongestQueryStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-longest-query',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Longest Query" />
  return (
    <StatCardView
      title="Longest Query"
      value={formatDuration(Number(data[0].query_duration_ms))}
    />
  )
}

function TotalStorageStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-total-storage',
    hostId,
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Total Storage" />
  const d = data[0]
  return (
    <StatCardView
      title="Total Storage"
      value={String(d.total_compressed)}
      subtitle={`${d.total_tables} tables, ${d.readable_rows} rows`}
    />
  )
}

function BusiestDayQueriesStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-busiest-day-queries',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Busiest Day by Queries" />
  const d = data[0] as { day: string | Date; readable_count: string }
  return (
    <StatCardView
      title="Busiest Day by Queries"
      value={String(d.readable_count)}
      subtitle={formatDay(d.day)}
    />
  )
}

function BusiestDayBytesStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-busiest-day-bytes',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Busiest Day by Data Scan" />
  const d = data[0] as { day: string | Date; readable_bytes: string; query_count: number }
  return (
    <StatCardView
      title="Busiest Day by Data Scan"
      value={String(d.readable_bytes)}
      subtitle={`${formatDay(d.day)} • ${d.query_count} queries`}
    />
  )
}

function BusiestSecondStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-busiest-second',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Busiest Second by Query Starts" />
  return (
    <StatCardView
      title="Busiest Second by Query Starts"
      value={String((data[0] as { readable_count: string }).readable_count)}
    />
  )
}

function AvgDurationStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-avg-duration',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Average Query Duration" />
  const d = data[0] as { avg_duration_ms: number; query_count: number }
  return (
    <StatCardView
      title="Average Query Duration"
      value={formatDuration(Number(d.avg_duration_ms))}
      subtitle={`${Number(d.query_count).toLocaleString()} queries`}
    />
  )
}

function ErrorRateStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-error-rate',
    hostId,
    lastHours: undefined, // All time by default
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Query Error Rate" />
  const d = data[0] as { error_rate: number; error_count: number; total_count: number }
  return (
    <StatCardView
      title="Query Error Rate"
      value={`${d.error_rate}%`}
      subtitle={`${d.error_count} of ${d.total_count.toLocaleString()} queries`}
    />
  )
}

function StatsGrid({ hostId }: { readonly hostId: number }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Primary stats - original 4 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <LargestScanStat hostId={hostId} />
        <FastestScanStat hostId={hostId} />
        <LongestQueryStat hostId={hostId} />
        <TotalStorageStat hostId={hostId} />
      </div>
      {/* Additional stats - new insights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <BusiestDayQueriesStat hostId={hostId} />
        <BusiestDayBytesStat hostId={hostId} />
        <BusiestSecondStat hostId={hostId} />
        <AvgDurationStat hostId={hostId} />
      </div>
      {/* Error rate stat */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ErrorRateStat hostId={hostId} />
      </div>
    </div>
  )
}

function ChartsSection({ hostId }: { readonly hostId: number }) {
  // Fetch data for charts to check if they have data
  const { data: topTablesData } = useChartData({
    chartName: 'insight-top-tables-by-size',
    hostId,
    lastHours: undefined,
  })
  const { data: compressionData } = useChartData({
    chartName: 'insight-compression-ratios',
    hostId,
    lastHours: undefined,
  })

  const hasTopTablesData = topTablesData && topTablesData.length > 0
  const hasCompressionData = compressionData && compressionData.length > 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {hasTopTablesData && (
        <LazyChartWrapper>
          <TopTablesBySizeChart hostId={hostId} />
        </LazyChartWrapper>
      )}
      {hasCompressionData && (
        <LazyChartWrapper>
          <CompressionRatiosChart hostId={hostId} />
        </LazyChartWrapper>
      )}
      {!hasTopTablesData && !hasCompressionData && (
        <div className="col-span-1 lg:col-span-2 text-center text-muted-foreground/60 py-8">
          No table data available
        </div>
      )}
    </div>
  )
}
