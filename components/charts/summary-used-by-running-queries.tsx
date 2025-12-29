'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/generic-charts/card-multi-metrics'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { formatReadableQuantity } from '@/lib/format-readable'
import { useFetchData } from '@/lib/swr'

const SQL = `
  SELECT COUNT() as query_count,
         SUM(memory_usage) as memory_usage,
         formatReadableSize(memory_usage) as readable_memory_usage
  FROM system.processes
`

const TOTAL_MEM_SQL = `
  SELECT metric,
         value as total,
         formatReadableSize(total) AS readable_total
  FROM system.asynchronous_metrics
  WHERE metric = 'CGroupMemoryUsed'
        OR metric = 'OSMemoryTotal'
  ORDER BY metric ASC
  LIMIT 1
`

const TODAY_QUERY_COUNT_SQL = `
  SELECT COUNT() as query_count
  FROM system.query_log
  WHERE type = 'QueryStart'
        AND query_start_time >= today()
`

const ROWS_READ_WRITTEN_SQL = `
  SELECT SUM(read_rows) as rows_read,
         SUM(written_rows) as rows_written,
         formatReadableQuantity(rows_read) as readable_rows_read,
         formatReadableQuantity(rows_written) as readable_rows_written
  FROM system.processes
`

export function ChartSummaryUsedByRunningQueries({
  title,
  className,
  hostId,
}: ChartProps) {
  const pathname = usePathname()
  const hostFromPath = pathname.split('/')[1] || '0'

  const { data: queryData, error: queryError, isLoading: queryLoading } =
    useFetchData<
      {
        query_count: number
        memory_usage: number
        readable_memory_usage: string
      }[]
    >(SQL, undefined, hostId)

  const { data: totalMemData } = useFetchData<
    {
      metric: string
      total: number
      readable_total: string
    }[]
  >(TOTAL_MEM_SQL, undefined, hostId)

  const { data: todayQueryData } = useFetchData<
    {
      query_count: number
    }[]
  >(TODAY_QUERY_COUNT_SQL, undefined, hostId)

  const { data: rowsData } = useFetchData<
    {
      rows_read: number
      rows_written: number
      readable_rows_read: string
      readable_rows_written: string
    }[]
  >(ROWS_READ_WRITTEN_SQL, undefined, hostId)

  const isLoading = queryLoading
  const error = queryError

  const items = useMemo(() => {
    const first = queryData?.[0]
    const totalMem = totalMemData?.[0]
    const todayQueryCount = todayQueryData?.[0]?.query_count ?? first?.query_count ?? 0
    const rowsReadWritten = rowsData?.[0] || {
      rows_read: 0,
      rows_written: 0,
      readable_rows_read: '0',
      readable_rows_written: '0',
    }

    if (!first || !totalMem) return []

    const result: CardMultiMetricsProps['items'] = []

    result.push({
      current: first.memory_usage,
      target: totalMem.total,
      currentReadable: `${first.readable_memory_usage} memory usage`,
      targetReadable: `${totalMem.readable_total} total`,
    })

    result.push({
      current: first.query_count,
      target: todayQueryCount,
      currentReadable: `${first.query_count} running queries`,
      targetReadable: `${formatReadableQuantity(todayQueryCount)} today`,
    })

    if (rowsReadWritten.rows_read < rowsReadWritten.rows_written) {
      result.push({
        current: rowsReadWritten.rows_read,
        target: rowsReadWritten.rows_written,
        currentReadable: `${rowsReadWritten.readable_rows_read} rows read`,
        targetReadable: `${rowsReadWritten.readable_rows_written} rows written`,
      })
    } else {
      result.push({
        current: rowsReadWritten.rows_written,
        target: rowsReadWritten.rows_read,
        currentReadable: `${rowsReadWritten.readable_rows_written} rows written`,
        targetReadable: `${rowsReadWritten.readable_rows_read} rows read`,
      })
    }

    return result
  }, [queryData, totalMemData, todayQueryData, rowsData])

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} />
  }

  const first = queryData?.[0]
  const totalMem = totalMemData?.[0]
  const todayQueryCount = todayQueryData?.[0]?.query_count ?? first?.query_count ?? 0

  if (!first || !totalMem) {
    return null
  }

  const allSql = `
    Total current memory usage by running queries:
    ${SQL}

    Total memory usage by system:
    ${TOTAL_MEM_SQL}

    Total query count today:
    ${TODAY_QUERY_COUNT_SQL}

    Total rows read and written:
    ${ROWS_READ_WRITTEN_SQL}
  `

  return (
    <ChartCard title={title} className={className} sql={allSql}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <div className="flex flex-col">
              <div>{first.query_count} queries</div>
              <div className="flex flex-row items-center gap-2">
                {first.readable_memory_usage} memory used for running queries
                <Link
                  href={`/${hostFromPath}/running-queries`}
                  className="inline"
                >
                  <ArrowRightIcon className="size-5" />
                </Link>
              </div>
            </div>
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
