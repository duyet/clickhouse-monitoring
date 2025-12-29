'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartFailedQueryCountByType({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
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
    user: string
    count: number
  }>({
    chartName: 'failed-query-count-by-user',
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

  // Single-pass algorithm: collect data and track users simultaneously
  const userSet = new Set<string>()
  const data = (dataArray || []).reduce(
    (acc, cur) => {
      const { event_time, user, count } = cur
      userSet.add(user)
      if (acc[event_time] === undefined) {
        acc[event_time] = {}
      }
      acc[event_time][user] = count
      return acc
    },
    {} as Record<string, Record<string, number>>
  )

  const barData = Object.entries(data).map(([event_time, obj]) => {
    return { event_time, ...obj }
  })

  // Convert set to array for categories
  const users = Array.from(userSet)

  return (
    <ChartCard title={title} className={className} sql={sql} data={barData}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={users}
        showLegend
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartFailedQueryCountByType
