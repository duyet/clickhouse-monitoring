import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'

export async function ChartNewPartsCreated({
  title = 'New Parts Created over last 24 hours (part counts / 15 minutes)',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
  ...props
}: ChartProps) {
  const query = `
    SELECT
        ${applyInterval(interval, 'event_time')},
        count() AS new_parts,
        table,
        sum(rows) AS total_rows,
        formatReadableQuantity(total_rows) AS readable_total_rows,
        sum(size_in_bytes) AS total_bytes_on_disk,
        formatReadableSize(total_bytes_on_disk) AS readable_total_bytes_on_disk
    FROM system.part_log
    WHERE (event_type = 'NewPart')
      AND (event_time > (now() - toIntervalHour(${lastHours})))
    GROUP BY
        event_time,
        table
    ORDER BY
        event_time ASC,
        table DESC
  `

  const { data: raw } = await fetchData<
    {
      event_time: string
      table: string
      new_parts: number
    }[]
  >({ query, hostId })

  const data = (raw || []).reduce(
    (acc, cur) => {
      const { event_time, table, new_parts } = cur
      if (acc[event_time] === undefined) {
        acc[event_time] = {}
      }

      acc[event_time][table] = new_parts
      return acc
    },
    {} as Record<string, Record<string, number>>
  )

  const barData = Object.entries(data).map(([event_time, obj]) => {
    return { event_time, ...obj }
  })

  // Group by table
  const tables = Object.values(data).reduce((acc, cur) => {
    return Array.from(new Set([...acc, ...Object.keys(cur)]))
  }, [] as string[])

  return (
    <ChartCard title={title} className={className} sql={query} data={barData}>
      <BarChart
        className={chartClassName}
        data={barData}
        index="event_time"
        categories={tables}
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartNewPartsCreated
