import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
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

export async function ChartQueryCountSpark({
  title,
  className,
  chartClassName,
}: ChartAvgMemoryProps) {
  const data = await fetchData(`
    SELECT toStartOfMinute(event_time) AS event_time,
           COUNT() AS query_count
    FROM system.query_log
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL 12 HOUR)
    GROUP BY 1
    ORDER BY 1
  `)

  return (
    <Card className={className}>
      {title ? (
        <CardHeader>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
      ) : null}

      <CardContent>
        <AreaChart
          className={cn('h-52', chartClassName)}
          data={data}
          index='event_time'
          categories={['query_count']}
          readable='quantity'
          stack
        />
      </CardContent>
    </Card>
  )
}

export default ChartQueryCountSpark
