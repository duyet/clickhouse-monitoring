import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/tremor'

export async function ChartTotalMemoryUsedByMerges({
  title,
  className,
}: ChartProps) {
  const usedSql = `
    SELECT
      SUM(memory_usage) as memory_usage,
      formatReadableSize(memory_usage) as readable_memory_usage
    FROM system.merges
  `
  const usedRows = await fetchData(usedSql)
  const used = usedRows?.[0]
  if (!usedRows || !used) return null

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
  let total
  try {
    const totalRows = await fetchData(totalSql)
    total = totalRows?.[0]
    if (!usedRows || !used) return null
  } catch (e) {
    console.error('Error fetching total memory usage', e)
  }

  return (
    <ChartCard
      title={title}
      className={className}
      sql={usedSql + '\n\n' + totalSql}
    >
      <div className="flex flex-col justify-between p-0">
        <CardMetric
          current={used.memory_usage}
          currentReadable={used.readable_memory_usage}
          target={total.total || used.memory_usage}
          targetReadable={total.readable_total || used.readable_memory_usage}
          className="p-2"
        />
        <div className="text-muted-foreground text-right text-sm">
          Total memory used by merges estimated from CGroupMemoryUsed or
          OSMemoryTotal
        </div>
      </div>
    </ChartCard>
  )
}

export default ChartTotalMemoryUsedByMerges
