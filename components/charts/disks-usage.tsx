import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor/area'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

export async function ChartDisksUsage({
  title = 'Disks Usage over last 30 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 30,
  ...props
}: ChartProps) {
  const sql = `
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${interval}(event_time) as event_time,
        map['DiskAvailable_default'] as DiskAvailable_default,
        map['DiskUsed_default'] as DiskUsed_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default,
        formatReadableSize(DiskUsed_default) as readable_DiskUsed_default
    FROM merge(system, '^asynchronous_metric_log')
    WHERE event_time >= (now() - toIntervalHour(${lastHours}))
    GROUP BY 1
    ORDER BY 1 ASC
  `

  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['DiskAvailable_default', 'DiskUsed_default']}
        readable={true}
        readableColumns={[
          'readable_DiskAvailable_default',
          'readable_DiskUsed_default',
        ]}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartDisksUsage
