import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { type ChartProps } from '@/components/charts/chart-props'
import { ChartCard } from '@/components/generic-charts/chart-card'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/tremor/card-multi-metrics'
import { fetchData } from '@/lib/clickhouse'
import { formatReadableQuantity } from '@/lib/format-readable'
import { getScopedLink } from '@/lib/scoped-link'

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
  const { data } = await fetchData<
    {
      query_count: number
      memory_usage: number
      readable_memory_usage: string
    }[]
  >({ query: sql })

  const first = data?.[0]
  if (!data || !first) return null

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
    const { data: totalRows } = await fetchData<
      {
        metric: string
        total: number
        readable_total: string
      }[]
    >({ query: totalMemSql })
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
    const { data: todayQueryCountRows } = await fetchData<
      {
        query_count: number
      }[]
    >({ query: todayQueryCountSql })
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
    const { data } = await fetchData<
      {
        rows_read: number
        rows_written: number
        readable_rows_read: string
        readable_rows_written: string
      }[]
    >({ query: rowsReadWrittenSql })
    if (!!data) {
      rowsReadWritten = data?.[0]
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
              <Link href={getScopedLink('/running-queries')} className="inline">
                <ArrowRightIcon className="size-5" />
              </Link>
            </span>
          }
          items={items}
          className="p-2"
        />
        <div className="text-right text-sm text-muted-foreground"></div>
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByRunningQueries
