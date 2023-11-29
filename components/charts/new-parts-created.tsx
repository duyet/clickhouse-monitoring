import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/tremor'

export async function ChartNewPartCreated({
  title = 'New Parts Created over last 24 hours (part counts / 15 minutes)',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  ...props
}: ChartProps) {
  const sql = `
    SELECT
        count() AS new_parts,
        ${interval}(event_time) AS event_time,
        table,
        sum(rows) AS total_written_rows,
        formatReadableQuantity(total_written_rows) AS readable_total_written_rows,
        sum(size_in_bytes) AS total_bytes_on_disk,
        formatReadableSize(total_bytes_on_disk) AS readable_total_bytes_on_disk
    FROM clusterAllReplicas(default, system.part_log)
    WHERE (event_type = 'NewPart') AND (event_time > (now() - toIntervalHour(${lastHours})))
    GROUP BY
        event_time,
        table
    ORDER BY
        event_time ASC,
        table DESC
  `

  const raw = await fetchData(sql)

  const data = raw.reduce((acc, cur) => {
    const { event_time, table, new_parts } = cur
    if (acc[event_time] === undefined) {
      acc[event_time] = {}
    }
    acc[event_time][table] = new_parts
    return acc
  }, {}) as Record<string, Record<string, number>>

  const barData = Object.entries(data).map(([event_time, obj]) => {
    return { event_time, ...obj }
  })

  // All users
  const tables = Object.values(data).reduce((acc, cur) => {
    return Array.from(new Set([...acc, ...Object.keys(cur)]))
  }, [] as string[])

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={tables}
        readable="quantity"
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartNewPartCreated
