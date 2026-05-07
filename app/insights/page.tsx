'use client'

export const dynamic = 'force-static'

import { createBarChart } from '@/components/charts/factory'
import { LazyChartWrapper } from '@/components/charts/lazy-chart-wrapper'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { formatDuration } from '@/lib/utils'

// Create bar chart components for insights
const TopTablesBySizeChart = createBarChart({
  chartName: 'insight-top-tables-by-size',
  index: 'table',
  categories: ['bytes'],
  defaultTitle: 'Top 10 Tables by Size',
})

const CompressionRatiosChart = createBarChart({
  chartName: 'insight-compression-ratios',
  index: 'table',
  categories: ['compression_ratio'],
  defaultTitle: 'Best Compression Ratios',
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
  })
  if (isLoading) return <StatSkeleton />
  if (error || !data?.length) return <StatEmpty title="Fastest Scan" />
  return (
    <StatCardView
      title="Fastest Scan Speed"
      value={String(data[0].readable_speed)}
    />
  )
}

function LongestQueryStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error } = useChartData({
    chartName: 'insight-longest-query',
    hostId,
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

function StatsGrid({ hostId }: { readonly hostId: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <LargestScanStat hostId={hostId} />
      <FastestScanStat hostId={hostId} />
      <LongestQueryStat hostId={hostId} />
      <TotalStorageStat hostId={hostId} />
    </div>
  )
}

function ChartsSection({ hostId }: { readonly hostId: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LazyChartWrapper>
        <TopTablesBySizeChart hostId={hostId} />
      </LazyChartWrapper>
      <LazyChartWrapper>
        <CompressionRatiosChart hostId={hostId} />
      </LazyChartWrapper>
    </div>
  )
}
