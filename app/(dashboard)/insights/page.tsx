'use client'

import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpDownIcon,
  BarChart3Icon,
  ClockIcon,
  DatabaseIcon,
  HardDriveIcon,
  TimerIcon,
  ZapIcon,
} from 'lucide-react'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { ChartDataPoint } from '@/types/chart-data'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { createBarChart } from '@/components/charts/factory'
import { LazyChartWrapper } from '@/components/charts/lazy-chart-wrapper'
import {
  DATE_RANGE_PRESETS,
  DateRangeSelector,
  RANGE_OPTIONS,
  useDateRange,
} from '@/components/date-range'
import { ChartSkeleton } from '@/components/skeletons/chart'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { formatDuration } from '@/lib/utils'

function formatDay(day: string | Date): string {
  return new Date(day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const TopTablesBySizeChart = createBarChart({
  chartName: 'insight-top-tables-by-size',
  index: 'table',
  categories: ['bytes'],
  defaultTitle: 'Top 10 Tables by Size',
  dateRangeConfig: 'insights',
  defaultLastHours: undefined,
})

const CompressionRatiosChart = createBarChart({
  chartName: 'insight-compression-ratios',
  index: 'table',
  categories: ['compression_ratio'],
  defaultTitle: 'Best Compression Ratios',
  dateRangeConfig: 'insights',
  defaultLastHours: undefined,
})

export default function InsightsPage() {
  const hostId = useHostId()
  const { lastHours, range, setRange } = useDateRange({
    config: DATE_RANGE_PRESETS.insights,
  })

  const rangeLabel = (
    RANGE_OPTIONS[range.value as keyof typeof RANGE_OPTIONS]?.description ??
    'All available data'
  ).toLowerCase()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cluster Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record-breaking queries, storage statistics, and performance
            highlights (showing {rangeLabel})
          </p>
        </div>
        <DateRangeSelector
          config={DATE_RANGE_PRESETS.insights}
          value={range.value}
          onChange={setRange}
          alwaysVisible
        />
      </div>
      <StatsGrid hostId={hostId} lastHours={lastHours} />
      <ChartsSection hostId={hostId} />
    </div>
  )
}

function statLoading(title: string) {
  return <ChartSkeleton title={title} />
}

function statEmpty(
  title: string,
  sql: string | undefined,
  data: ChartDataPoint[] | undefined,
  metadata: CardToolbarMetadata | undefined
) {
  return (
    <ChartEmpty
      title={title}
      sql={sql}
      data={data}
      metadata={metadata}
      compact
    />
  )
}

function LargestScanStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-largest-scan',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Largest Scan')
  if (error || !data?.length)
    return statEmpty('Largest Scan', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <ChartCard
      title="Largest Scan"
      icon={<HardDriveIcon className="size-3.5 text-blue-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.readable_bytes)}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {String(d.readable_rows)} in{' '}
        {formatDuration(Number(d.query_duration_ms))}
      </div>
    </ChartCard>
  )
}

function FastestScanStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-fastest-scan',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Fastest Scan Speed')
  if (error || !data?.length)
    return statEmpty('Fastest Scan Speed', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <ChartCard
      title="Fastest Scan Speed"
      icon={<ZapIcon className="size-3.5 text-yellow-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.readable_speed)}/s
      </div>
    </ChartCard>
  )
}

function LongestQueryStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-longest-query',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Longest Query')
  if (error || !data?.length)
    return statEmpty('Longest Query', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <ChartCard
      title="Longest Query"
      icon={<ClockIcon className="size-3.5 text-red-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {formatDuration(Number(d.query_duration_ms))}
      </div>
    </ChartCard>
  )
}

function TotalStorageStat({ hostId }: { readonly hostId: number }) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-total-storage',
    hostId,
  })
  if (isLoading) return statLoading('Total Storage')
  if (error || !data?.length)
    return statEmpty('Total Storage', sql, data, metadata)
  const d = data[0] as Record<string, unknown>
  return (
    <ChartCard
      title="Total Storage"
      icon={<DatabaseIcon className="size-3.5 text-emerald-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.total_compressed)}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {String(d.total_tables)} tables, {String(d.readable_rows)} rows
      </div>
    </ChartCard>
  )
}

function BusiestDayQueriesStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-busiest-day-queries',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Busiest Day by Queries')
  if (error || !data?.length)
    return statEmpty('Busiest Day by Queries', sql, data, metadata)
  const d = data[0] as { day: string | Date; readable_count: string }
  return (
    <ChartCard
      title="Busiest Day by Queries"
      icon={<BarChart3Icon className="size-3.5 text-purple-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.readable_count)}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {formatDay(d.day)}
      </div>
    </ChartCard>
  )
}

function BusiestDayBytesStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-busiest-day-bytes',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Busiest Day by Data Scan')
  if (error || !data?.length)
    return statEmpty('Busiest Day by Data Scan', sql, data, metadata)
  const d = data[0] as {
    day: string | Date
    readable_bytes: string
    query_count: number
  }
  return (
    <ChartCard
      title="Busiest Day by Data Scan"
      icon={<ArrowUpDownIcon className="size-3.5 text-orange-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.readable_bytes)}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {formatDay(d.day)} &middot; {d.query_count} queries
      </div>
    </ChartCard>
  )
}

function BusiestSecondStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-busiest-second',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Busiest Second by Query Starts')
  if (error || !data?.length)
    return statEmpty('Busiest Second by Query Starts', sql, data, metadata)
  const d = data[0] as { readable_count: string }
  return (
    <ChartCard
      title="Busiest Second by Query Starts"
      icon={<ActivityIcon className="size-3.5 text-cyan-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {String(d.readable_count)}
      </div>
    </ChartCard>
  )
}

function AvgDurationStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-avg-duration',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Average Query Duration')
  if (error || !data?.length)
    return statEmpty('Average Query Duration', sql, data, metadata)
  const d = data[0] as { avg_duration_ms: number; query_count: number }
  return (
    <ChartCard
      title="Average Query Duration"
      icon={<TimerIcon className="size-3.5 text-indigo-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {formatDuration(Number(d.avg_duration_ms))}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {d.query_count.toLocaleString()} queries
      </div>
    </ChartCard>
  )
}

function ErrorRateStat({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  const { data, isLoading, error, sql, metadata } = useChartData({
    chartName: 'insight-error-rate',
    hostId,
    lastHours,
  })
  if (isLoading) return statLoading('Query Error Rate')
  if (error || !data?.length)
    return statEmpty('Query Error Rate', sql, data, metadata)
  const d = data[0] as {
    error_rate: number
    error_count: number
    total_count: number
  }
  return (
    <ChartCard
      title="Query Error Rate"
      icon={<AlertTriangleIcon className="size-3.5 text-rose-500" />}
      sql={sql}
      data={data}
      metadata={metadata}
      enableScaleToggle={false}
      headerClassName="py-1"
      contentClassName="min-h-[60px]"
    >
      <div className="text-xl font-bold tracking-tight truncate">
        {d.error_rate}%
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground truncate">
        {d.error_count} of {d.total_count.toLocaleString()} queries
      </div>
    </ChartCard>
  )
}

function StatsGrid({
  hostId,
  lastHours,
}: {
  readonly hostId: number
  readonly lastHours?: number
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <LargestScanStat hostId={hostId} lastHours={lastHours} />
        <FastestScanStat hostId={hostId} lastHours={lastHours} />
        <LongestQueryStat hostId={hostId} lastHours={lastHours} />
        <TotalStorageStat hostId={hostId} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <BusiestDayQueriesStat hostId={hostId} lastHours={lastHours} />
        <BusiestDayBytesStat hostId={hostId} lastHours={lastHours} />
        <BusiestSecondStat hostId={hostId} lastHours={lastHours} />
        <AvgDurationStat hostId={hostId} lastHours={lastHours} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ErrorRateStat hostId={hostId} lastHours={lastHours} />
      </div>
    </div>
  )
}

function ChartsSection({ hostId }: { readonly hostId: number }) {
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
        <div className="col-span-1 text-center text-muted-foreground/60 py-8 lg:col-span-2">
          No table data available
        </div>
      )}
    </div>
  )
}
