import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { DonutChart } from '@/components/charts/visualizations/donut'
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
  const { data, error } = await fetchData<
    {
      type: string
      query_count: number
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

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
