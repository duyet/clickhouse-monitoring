import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'

export async function ChartFailedQueryCountByType({
  title,
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
           countDistinct(query_id) AS count
    FROM merge(system, '^query_log')
    WHERE
          type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `
  const { data: raw } = await fetchData<
    {
      event_time: string
      user: string
      count: number
    }[]
  >({ query, hostId })

  const data = (raw || []).reduce(
    (acc, cur) => {
      const { event_time, user, count } = cur
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

  const users = Object.values(data).reduce((acc, cur) => {
    return Array.from(new Set([...acc, ...Object.keys(cur)]))
  }, [] as string[])

  return (
    <ChartCard title={title} className={className} sql={query} data={barData}>
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
