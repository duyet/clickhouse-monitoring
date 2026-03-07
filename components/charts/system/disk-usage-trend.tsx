'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { ChartDataPoint } from '@/types/chart-data'

import { useMemo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { AreaChart } from '@/components/charts/primitives/area'
import { useChartData, useHostId } from '@/lib/swr'
import { chartTickFormatters, createDateTickFormatter } from '@/lib/utils'

const CHART_NAME = 'disk-usage-trend'
const DEFAULT_TITLE = 'Disk Usage Trend (7 Days)'
const DEFAULT_INTERVAL = 'toStartOfHour'
const DEFAULT_LAST_HOURS = 24 * 7

type RawRow = {
  event_time: string
  metric: string
  usage: number
}

/**
 * Pivot long-form (event_time, metric, usage) rows into wide-form rows
 * suitable for AreaChart: { event_time, DiskUsed_default: n, DiskUsed_s3: n, ... }
 */
function pivotRows(rows: RawRow[]): {
  pivoted: Record<string, string | number>[]
  categories: string[]
} {
  const metricSet = new Set<string>()
  const byTime = new Map<string, Record<string, string | number>>()

  for (const row of rows) {
    metricSet.add(row.metric)
    let entry = byTime.get(row.event_time)
    if (!entry) {
      entry = { event_time: row.event_time }
      byTime.set(row.event_time, entry)
    }
    entry[row.metric] = row.usage
  }

  const categories = Array.from(metricSet).sort()
  const pivoted = Array.from(byTime.values()).sort((a, b) =>
    String(a.event_time).localeCompare(String(b.event_time))
  )

  return { pivoted, categories }
}

export function ChartDiskUsageTrend({
  title = DEFAULT_TITLE,
  interval = DEFAULT_INTERVAL,
  lastHours = DEFAULT_LAST_HOURS,
  className,
  chartClassName,
}: ChartProps) {
  const hostId = useHostId()
  const swr = useChartData<RawRow>({
    chartName: CHART_NAME,
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  const { pivoted, categories } = useMemo(() => {
    if (!swr.data || swr.data.length === 0) {
      return { pivoted: [], categories: [] }
    }
    return pivotRows(swr.data)
  }, [swr.data])

  const tickFormatter = useMemo(
    () => createDateTickFormatter(lastHours),
    [lastHours]
  )

  if (!swr.isLoading && !swr.error && pivoted.length === 0) {
    return (
      <ChartEmpty
        title={title}
        className={className}
        description="No disk usage data recorded in this time period"
        sql={swr.sql}
        data={swr.data}
        metadata={swr.metadata}
        onRetry={() => swr.mutate()}
      />
    )
  }

  return (
    <ChartContainer
      swr={swr}
      title={title}
      className={className}
      chartClassName={chartClassName}
    >
      {(_, sql, metadata, staleError, mutate) => (
        <ChartCard
          title={title}
          sql={sql}
          data={pivoted as ChartDataPoint[]}
          metadata={metadata}
          data-testid="disk-usage-trend-chart"
          staleError={staleError}
          onRetry={mutate}
        >
          <AreaChart
            className="h-full w-full"
            data={pivoted as ChartDataPoint[]}
            index="event_time"
            categories={categories}
            showLegend={categories.length > 1}
            tickFormatter={tickFormatter}
            yAxisTickFormatter={chartTickFormatters.bytes}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
}

export type ChartDiskUsageTrendProps = ChartProps

export default ChartDiskUsageTrend
