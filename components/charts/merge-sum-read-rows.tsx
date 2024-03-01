import { fetchData } from '@/lib/clickhouse'
import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/tremor/bar'

import { ChartCard } from '../chart-card'

export async function ChartMergeSumReadRows({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
}: ChartProps) {
  const sql = `
    SELECT
        ${interval}(event_time) as event_time,
        SUM(read_rows) AS sum_read_rows,
        formatReadableQuantity(sum_read_rows) AS readable_sum_read_rows
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
  `
  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <BarChart
        data={data}
        index="event_time"
        categories={['sum_read_rows']}
        readableColumn="readable_sum_read_rows"
        className={className}
        colors={['orange']}
        autoMinValue={true}
        relative={true}
      />
    </ChartCard>
  )
}

export default ChartMergeSumReadRows
