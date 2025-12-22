import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { CardMetric } from '@/components/charts/base/card-metric'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'

export async function ChartQueryCache({
  title = 'Query Cache',
  className,
  hostId,
}: ChartProps & { name?: string }) {
  const query = `
    SELECT 
      sumIf(result_size, stale = 0) AS total_result_size,
      sumIf(result_size, stale = 1) AS total_staled_result_size,
      formatReadableSize(total_result_size) AS readable_total_result_size,
      formatReadableSize(total_staled_result_size) AS readable_total_staled_result_size
    FROM system.query_cache
  `
  const { data, error } = await fetchData<
    {
      total_result_size: number
      total_staled_result_size: number
      readable_total_result_size: string
      readable_total_staled_result_size: string
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

  const first = data[0]
  if (!first) return null

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
    >
      <CardMetric
        current={first.total_result_size}
        currentReadable={`${first.readable_total_result_size} cached`}
        target={first.total_staled_result_size}
        targetReadable={`${first.readable_total_staled_result_size} staled`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartQueryCache
