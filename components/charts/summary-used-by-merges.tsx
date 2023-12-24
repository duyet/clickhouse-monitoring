import { fetchData } from '@/lib/clickhouse'
import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { CardMultiMetrics } from '@/components/tremor'

export async function ChartSummaryUsedByMerges({
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
  const totalMemSql = `
    SELECT metric, value as total, formatReadableSize(total) AS readable_total
    FROM system.asynchronous_metrics
    WHERE
        metric = 'CGroupMemoryUsed'
        OR metric = 'OSMemoryTotal'
    ORDER BY metric ASC
    LIMIT 1
  `
  let totalMem = {
    total: used.memory_usage,
    readable_total: used.readable_memory_usage,
  }
  try {
    const rows = await fetchData(totalMemSql)
    if (!rows) return null
    totalMem = rows?.[0]
  } catch (e) {
    console.error('Error fetching total memory usage', e)
  }

  let rowsReadWritten = {
    rows_read: 0,
    rows_written: 0,
    readable_rows_read: '0',
    readable_rows_written: '0',
  }
  const rowsReadWrittenSql = `
    SELECT SUM(rows_read) as rows_read,
           SUM(rows_written) as rows_written,
           formatReadableQuantity(rows_read) as readable_rows_read,
           formatReadableQuantity(rows_written) as readable_rows_written
    FROM system.merges
  `
  try {
    const rows = await fetchData(rowsReadWrittenSql)
    if (!rows) return null
    rowsReadWritten = rows?.[0]
  } catch (e) {
    console.error('Error fetching rows read', e)
  }

  const sql = `
    Current memory used by merges:
    ${usedSql}

    Total memory used by merges estimated from CGroupMemoryUsed or OSMemoryTotal:
    ${totalMemSql}
  `

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={used.readable_memory_usage + ' memory used'}
          currents={[rowsReadWritten.rows_written, used.memory_usage]}
          currentReadables={[
            rowsReadWritten.readable_rows_written + ' rows written',
            used.readable_memory_usage + ' memory used',
          ]}
          targets={[rowsReadWritten.rows_read, totalMem.total]}
          targetReadables={[
            rowsReadWritten.readable_rows_read + ' rows read',
            totalMem.readable_total,
          ]}
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

export default ChartSummaryUsedByMerges
