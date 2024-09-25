import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'

export async function ChartMergeSumReadRows({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT
        ${applyInterval(interval, 'event_time')},
        SUM(read_rows) AS sum_read_rows,
        log10(sum_read_rows) * 100 AS sum_read_rows_scale,
        formatReadableQuantity(sum_read_rows) AS readable_sum_read_rows
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
  `
  const { data } = await fetchData<
    {
      event_time: string
      sum_read_rows: number
      sum_read_rows_scale: number
      readable_sum_read_rows: string
    }[]
  >({ query })

  return (
    <ChartCard title={title} className={className} sql={query} data={data}>
      <BarChart
        data={data}
        index="event_time"
        categories={['sum_read_rows_scale']}
        readableColumn="readable_sum_read_rows"
        labelPosition="inside"
        labelAngle={-90}
        colorLabel="--foreground"
        className={chartClassName}
        colors={['--chart-indigo-300']}
        autoMinValue={true}
        relative={false}
        allowDecimals={true}
      />
    </ChartCard>
  )
}

export default ChartMergeSumReadRows
