import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { CardMultiMetrics } from '@/components/charts/base/card-multi-metrics'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'

export async function ChartSummaryUsedByMutations({
  title,
  className,
  hostId,
}: ChartProps) {
  const query = `
    SELECT COUNT() as running_count
    FROM system.mutations
    WHERE is_done = 0
  `
  const { data, error } = await fetchData<
    {
      running_count: number
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

  const count = data[0] || { running_count: 0 }

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
    >
      <div className="flex flex-col content-stretch items-center p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2 self-center text-center">
              {count.running_count} running mutations
            </span>
          }
          className="p-2"
        />
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByMutations
