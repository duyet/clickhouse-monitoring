import { type ChartProps } from '@/components/charts/chart-props'
import { DonutChart } from '@/components/tremor/donut'
import { fetchData } from '@/lib/clickhouse'

export async function ChartQueryType({
  title,
  className,
  chartClassName,
  lastHours = 24,
  hostId,
  ...props
}: ChartProps) {
  const query = `
    SELECT type,
           COUNT() AS query_count
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `
  const { data } = await fetchData<
    {
      type: string
      query_count: number
    }[]
  >({ query, hostId })

  return (
    <DonutChart
      data={data || []}
      index="type"
      categories={['query_count']}
      readable="quantity"
      {...props}
    />
  )
}

export default ChartQueryType
