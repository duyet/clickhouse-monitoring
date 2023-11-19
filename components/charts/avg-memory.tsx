import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

export async function ChartAvgMemory({
  title,
  interval = 'toStartOfTenMinutes',
  className,
  chartClassName,
}: ChartProps) {
  const data = await fetchData(`
    SELECT ${interval}(event_time) as event_time,
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL 1 DAY)
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <AreaChart
          className={cn(chartClassName)}
          data={data}
          index="event_time"
          categories={['avg_memory']}
          readable="size"
          yAxisWidth={60}
        />
      </CardContent>
    </Card>
  )
}

export default ChartAvgMemory
