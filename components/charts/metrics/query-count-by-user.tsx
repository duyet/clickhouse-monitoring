import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { BarChart } from '@/components/charts/base/bar'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { chartTickFormatters } from '@/lib/utils'

export async function ChartQueryCountByUser({
  title = 'Total Queries over last 14 days by users',
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
  ...props
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           COUNT(*) AS count
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
          AND user != ''
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `
  const { data: raw, error } = await fetchData<
    {
      event_time: string
      user: string
      count: number
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!raw) return null

  // Single-pass algorithm: collect data and track users simultaneously
  const userSet = new Set<string>()
  const data = (raw || []).reduce(
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
    <ChartCard title={title} className={className} sql={query} data={barData}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={users}
        showLegend
        stack
        xAxisLabel="Date"
        yAxisLabel="Query Count"
        yAxisTickFormatter={chartTickFormatters.count}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCountByUser
