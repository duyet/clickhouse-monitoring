import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

export async function ChartMergeCountSpark({
  title,
  interval = 'toStartOfFiveMinutes',
  lastHours = 12,
  className,
  chartClassName,
}: ChartProps) {
  const data = await fetchData(`
    SELECT ${interval}(event_time) AS event_time,
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(ProfileEvent_MergedRows) AS avg_ProfileEvent_MergedRows
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `)

  return (
    <ChartCard title={title} className={className}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={[
          'avg_CurrentMetric_Merge',
          'avg_ProfileEvent_MergedRows',
        ]}
        readable="quantity"
        stack
      />
    </ChartCard>
  )
}

export default ChartMergeCountSpark
