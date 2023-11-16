import { fetchData } from '@/lib/clickhouse'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { AreaChart } from '@/components/tremor'

import { ClickHouseIntervalFunc } from '../interval-select'

interface ChartAvgMemoryProps {
  title?: string
  interval?: ClickHouseIntervalFunc
  className?: string
  chartClassName?: string
}

export async function ChartQueryCount({
  title,
  interval = 'toStartOfDay',
  className,
  chartClassName,
}: ChartAvgMemoryProps) {
  const raw = await fetchData(`
    SELECT ${interval}(event_time) AS event_time,
           user,
           COUNT(*) AS count
    FROM system.query_log
    WHERE type = 'QueryFinish'
    GROUP BY 1, 2
    ORDER BY 3
  `)

  const data = raw.reduce((acc, cur) => {
    const { event_time, user, count } = cur
    if (acc[event_time] === undefined) {
      acc[event_time] = {}
    }
    acc[event_time][user] = count
    return acc
  }, {}) as Record<string, Record<string, number>>

  const barData = Object.entries(data).map(([event_time, obj]) => {
    return { event_time, ...obj }
  })

  // All users
  const users = Object.values(data).reduce((acc, cur) => {
    return Array.from(new Set([...acc, ...Object.keys(cur)]))
  }, [] as string[])

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <AreaChart
          className={chartClassName}
          data={barData}
          index="event_time"
          categories={users}
          readable="quantity"
          stack
        />
      </CardContent>
    </Card>
  )
}

export default ChartQueryCount
