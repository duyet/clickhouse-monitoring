import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

import { ChartCard } from '../chart-card'

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
    <ChartCard title={title} className={className}>
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

export default ChartAvgMemory
