import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchDataWithHost } from '@/lib/clickhouse-helpers'
import { applyInterval } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'

export async function ChartDisksUsage({
  title = 'Disks Usage over last 30 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 30,
  ...props
}: ChartProps) {
  const query = `
    WITH CAST(sumMap(map(metric, value)), 'Map(LowCardinality(String), UInt32)') AS map
    SELECT
        ${applyInterval(interval, 'event_time')},
        map['DiskAvailable_default'] as DiskAvailable_default,
        map['DiskUsed_default'] as DiskUsed_default,
        formatReadableSize(DiskAvailable_default) as readable_DiskAvailable_default,
        formatReadableSize(DiskUsed_default) as readable_DiskUsed_default
    FROM merge(system, '^asynchronous_metric_log')
    WHERE event_time >= (now() - toIntervalHour(${lastHours}))
    GROUP BY 1
    ORDER BY 1 ASC
  `

  const { data } = await fetchDataWithHost<
    {
      event_time: string
      DiskAvailable_default: number
      DiskUsed_default: number
      readable_DiskAvailable_default: string
      readable_DiskUsed_default: string
    }[]
  >({ query })

  return (
    <ChartCard title={title} className={className} sql={query} data={data || []} data-testid="disk-usage-chart">
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['DiskAvailable_default', 'DiskUsed_default']}
        readableColumns={[
          'readable_DiskAvailable_default',
          'readable_DiskUsed_default',
        ]}
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartDisksUsage
