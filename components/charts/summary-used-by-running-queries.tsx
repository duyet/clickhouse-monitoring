import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'

import { fetchData } from '@/lib/clickhouse'
import { formatReadableQuantity } from '@/lib/format-readable'
import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/tremor/card-multi-metrics'

export async function ChartSummaryUsedByRunningQueries({
  title,
  className,
}: ChartProps) {
  const sql = `
    SELECT COUNT() as query_count,
           SUM(memory_usage) as memory_usage,
           formatReadableSize(memory_usage) as readable_memory_usage
    FROM system.processes
  `
  const rows = await fetchData(sql)
  const first = rows?.[0]
  if (!rows || !first) return null

  // Workaround for getting total memory usage
  const totalMemSql = `
    SELECT metric,
           value as total,
           formatReadableSize(total) AS readable_total
    FROM system.asynchronous_metrics
    WHERE metric = 'CGroupMemoryUsed'
          OR metric = 'OSMemoryTotal'
    ORDER BY metric ASC
    LIMIT 1
  `
  let totalMem = {
    total: first.memory_usage,
    readable_total: first.readable_memory_usage,
  }
  try {
    const totalRows = await fetchData(totalMemSql)
    totalMem = totalRows?.[0]
    if (!totalRows || !totalMem) return null
  } catch (e) {
    console.error('Error fetching total memory usage', e)
  }

  let todayQueryCount = first.query_count
  let todayQueryCountSql = `
    SELECT COUNT() as query_count
    FROM system.query_log
    WHERE type = 'QueryStart'
          AND query_start_time >= today()
  `
  try {
    const todayQueryCountRows = await fetchData(todayQueryCountSql)
    todayQueryCount = todayQueryCountRows?.[0]?.query_count
    if (!todayQueryCountRows || !todayQueryCount) return null
  } catch (e) {
    console.error('Error fetching today query count', e)
  }

  let rowsReadWritten = {
    rows_read: 0,
    rows_written: 0,
    readable_rows_read: '0',
    readable_rows_written: '0',
  }
  const rowsReadWrittenSql = `
    SELECT SUM(read_rows) as rows_read,
           SUM(written_rows) as rows_written,
           formatReadableQuantity(rows_read) as readable_rows_read,
           formatReadableQuantity(rows_written) as readable_rows_written
    FROM system.processes
  `
  try {
    const rows = await fetchData(rowsReadWrittenSql)
    if (!!rows) {
      rowsReadWritten = rows?.[0]
    }
  } catch (e) {
    console.error('Error fetching rows read', e)
  }

  const allSql = `
    Total current memory usage by running queries:
    ${sql}

    Total memory usage by system:
    ${totalMemSql}

    Total query count today:
    ${todayQueryCountSql}

    Total rows read and written:
    ${rowsReadWrittenSql}
  `

  const items: CardMultiMetricsProps['items'] = []
  items.push({
    current: first.memory_usage,
    target: totalMem.total,
    currentReadable: first.readable_memory_usage + ' memory usage',
    targetReadable: totalMem.readable_total + ' total',
  })
  items.push({
    current: first.query_count,
    target: todayQueryCount,
    currentReadable: first.query_count + ' running queries',
    targetReadable: formatReadableQuantity(todayQueryCount) + ' today',
  })

  if (rowsReadWritten.rows_read < rowsReadWritten.rows_written) {
    items.push({
      current: rowsReadWritten.rows_read,
      target: rowsReadWritten.rows_written,
      currentReadable: rowsReadWritten.readable_rows_read + ' rows read',
      targetReadable: rowsReadWritten.readable_rows_written + ' rows written',
    })
  } else {
    items.push({
      current: rowsReadWritten.rows_written,
      target: rowsReadWritten.rows_read,
      currentReadable: rowsReadWritten.readable_rows_written + ' rows written',
      targetReadable: rowsReadWritten.readable_rows_read + ' rows read',
    })
  }

  return (
    <ChartCard title={title} className={className} sql={allSql}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2">
              {first.query_count} queries, {first.readable_memory_usage} memory
              used for running queries
              <Link href="/running-queries" className="inline">
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </span>
          }
          items={items}
          className="p-2"
        />
        <div className="text-muted-foreground text-right text-sm"></div>
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByRunningQueries
