import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { CardMultiMetrics } from '@/components/tremor'

export async function ChartSummaryUsedByRunningQueries({
  title,
  className,
}: ChartProps) {
  const sql = `
    SELECT
      COUNT() as query_count,
      SUM(memory_usage) as memory_usage,
      formatReadableSize(memory_usage) as readable_memory_usage
    FROM system.processes
  `
  const rows = await fetchData(sql)
  const first = rows?.[0]
  if (!rows || !first) return null

  // Workaround for getting total memory usage
  const totalSql = `
    SELECT metric, value as total, formatReadableSize(total) AS readable_total
    FROM system.asynchronous_metrics
    WHERE
        metric = 'CGroupMemoryUsed'
        OR metric = 'OSMemoryTotal'
    ORDER BY metric ASC
    LIMIT 1
  `
  let total = {
    total: first.memory_usage,
    readable_total: first.readable_memory_usage,
  }
  try {
    const totalRows = await fetchData(totalSql)
    total = totalRows?.[0]
    if (!totalRows || !total) return null
  } catch (e) {
    console.error('Error fetching total memory usage', e)
  }

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={first.query_count + ' running queries'}
          currents={[first.memory_usage, first.query_count]}
          currentReadables={[
            first.readable_memory_usage + ' memory usage',
            first.query_count + ' running queries',
          ]}
          targets={[total.total, first.query_count]}
          targetReadables={[total.readable_total, first.query_count]}
          className="p-2"
        />
        <div className="text-muted-foreground text-right text-sm"></div>
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByRunningQueries
