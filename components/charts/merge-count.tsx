import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

export async function ChartMergeCount({
  title,
  interval = 'toStartOfFiveMinutes',
  lastHours = 12,
  className,
  chartClassName,
}: ChartProps) {
  const sql = `
    SELECT ${interval}(event_time) AS event_time,
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(CurrentMetric_PartMutation) AS avg_CurrentMetric_PartMutation
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `

  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
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
    </ChartCard>
  )
}

export default ChartMergeCount
