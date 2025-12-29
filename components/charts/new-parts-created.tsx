'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartNewPartsCreated({
  title = 'New Parts Created over last 24 hours (part counts / 15 minutes)',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
  ...props
}: ChartProps) {
  const {
    data: raw,
    isLoading,
    error,
    refresh,
    sql,
  } = useChartData<{
    event_time: string
    table: string
    new_parts: number
  }>({
    chartName: 'new-parts-created',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  const dataArray = Array.isArray(raw) ? raw : undefined

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  // Single-pass algorithm: collect data and track tables simultaneously
  const tableSet = new Set<string>()
  const data = dataArray.reduce(
    (acc, cur) => {
      const { event_time, table, new_parts } = cur
      tableSet.add(table)
      if (acc[event_time] === undefined) {
        acc[event_time] = {}
      }

      acc[event_time][table] = new_parts
      return acc
    },
    {} as Record<string, Record<string, number>>
  )

  const barData = Object.entries(data).map(([event_time, obj]) => {
    return { event_time, ...obj }
  })

  // Convert set to array for categories
  const tables = Array.from(tableSet)

  return (
    <ChartCard title={title} className={className} sql={sql} data={barData}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={tables}
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartNewPartsCreated
