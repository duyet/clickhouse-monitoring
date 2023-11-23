import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

export async function ChartDisksUsage({
  title,
  interval = 'toStartOfHour',
  className,
  chartClassName,
  lastHours = 24 * 7,
  ...props
}: ChartProps) {
  const data = await fetchData(`
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${interval}(event_time) as event_time,
        map['DiskAvailable_default'] as DiskAvailable_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default
    FROM system.asynchronous_metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  return (
    <ChartCard title={title} className={className}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['DiskAvailable_default']}
        readableColumns={['readable_DiskAvailable_default']}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartDisksUsage
