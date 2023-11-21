import { fetchData } from '@/lib/clickhouse'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

import { ChartCard } from '../chart-card'

export async function ChartAvgMemory({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
}: ChartProps) {
  const data = await fetchData(`
    SELECT ${interval}(event_time) as event_time,
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  return (
    <ChartCard title={title} className={className}>
      <AreaChart
        data={data}
        index="event_time"
        categories={['avg_memory']}
        className={className}
        readable={true}
        readableColumns={['readable_avg_memory']}
      />
    </ChartCard>
  )
}

export default ChartAvgMemory
