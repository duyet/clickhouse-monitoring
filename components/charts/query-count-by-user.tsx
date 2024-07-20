import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'

export async function ChartQueryCountByUser({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  ...props
}: ChartProps) {
  const query = `
    SELECT toDate(${interval}(event_time)) AS event_time,
           user,
           COUNT(*) AS count
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1, 2
    ORDER BY
      1 ASC WITH FILL STEP toIntervalDay(1),
      3 DESC
  `
  const { data: raw } = await fetchData<
    {
      event_time: string
      user: string
      count: number
    }[]
  >({ query })

  const data = raw.reduce(
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

  // All users
  const users = Object.values(data).reduce((acc, cur) => {
    return Array.from(new Set([...acc, ...Object.keys(cur)]))
  }, [] as string[])

  return (
    <ChartCard title={title} className={className} sql={query}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={users}
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCountByUser
