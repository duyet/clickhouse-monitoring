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

interface ChartMergeCountSparkProps {
  title?: string
  interval?: ClickHouseIntervalFunc
  className?: string
  chartClassName?: string
}

export async function ChartMergeCountSpark({
  title,
  className,
  chartClassName,
}: ChartMergeCountSparkProps) {
  const data = await fetchData(`
    SELECT toStartOfFiveMinutes(event_time) AS event_time,
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(CurrentMetric_PartMutation)  AS avg_CurrentMetric_PartMutation
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL 12 HOUR)
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
          index="event_time"
          categories={[
            'avg_CurrentMetric_Merge',
            'avg_CurrentMetric_PartMutation',
          ]}
          readable="quantity"
          stack
        />
      </CardContent>
    </Card>
  )
}

export default ChartMergeCountSpark
