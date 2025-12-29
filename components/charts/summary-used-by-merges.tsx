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
import { useFetchData } from '@/lib/swr'

const USED_SQL = `
  SELECT
    SUM(memory_usage) as memory_usage,
    formatReadableSize(memory_usage) as readable_memory_usage
  FROM system.merges
`

const TOTAL_MEM_SQL = `
  SELECT metric, value as total, formatReadableSize(total) AS readable_total
  FROM system.asynchronous_metrics
  WHERE
      metric = 'CGroupMemoryUsed'
      OR metric = 'OSMemoryTotal'
  ORDER BY metric ASC
  LIMIT 1
`

const ROWS_READ_WRITTEN_SQL = `
  SELECT SUM(rows_read) as rows_read,
         SUM(rows_written) as rows_written,
         formatReadableQuantity(rows_read) as readable_rows_read,
         formatReadableQuantity(rows_written) as readable_rows_written
  FROM system.merges
`

const BYTES_READ_WRITTEN_SQL = `
  SELECT SUM(bytes_read_uncompressed) as bytes_read,
         SUM(bytes_written_uncompressed) as bytes_written,
         formatReadableSize(bytes_read) as readable_bytes_read,
         formatReadableSize(bytes_written) as readable_bytes_written
  FROM system.merges
`

export function ChartSummaryUsedByMerges({
  title,
  className,
  hostId,
}: ChartProps) {
  const pathname = usePathname()
  const hostFromPath = pathname.split('/')[1] || '0'

  const { data: usedData, error: usedError, isLoading: usedLoading } =
    useFetchData<
      {
        memory_usage: number
        readable_memory_usage: string
      }[]
    >(USED_SQL, undefined, hostId)

  const { data: totalMemData } = useFetchData<
    {
      metric: string
      total: number
      readable_total: string
    }[]
  >(TOTAL_MEM_SQL, undefined, hostId)

  const { data: rowsData } = useFetchData<
    {
      rows_read: number
      rows_written: number
      readable_rows_read: string
      readable_rows_written: string
    }[]
  >(ROWS_READ_WRITTEN_SQL, undefined, hostId)

  const { data: bytesData } = useFetchData<
    {
      bytes_read: number
      bytes_written: number
      readable_bytes_read: string
      readable_bytes_written: string
    }[]
  >(BYTES_READ_WRITTEN_SQL, undefined, hostId)

  const isLoading = usedLoading
  const error = usedError

  const items = useMemo(() => {
    const used = usedData?.[0]
    const totalMem = totalMemData?.[0]
    const rowsReadWritten = rowsData?.[0] || {
      rows_read: 0,
      rows_written: 0,
      readable_rows_read: '0',
      readable_rows_written: '0',
    }
    const bytesReadWritten = bytesData?.[0] || {
      bytes_read: 0,
      bytes_written: 0,
      readable_bytes_read: '0',
      readable_bytes_written: '0',
    }

    if (!used || !totalMem) return []

    const result: CardMultiMetricsProps['items'] = []

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

    if (bytesReadWritten.bytes_read < bytesReadWritten.bytes_written) {
      result.push({
        current: bytesReadWritten.bytes_read,
        target: bytesReadWritten.bytes_written,
        currentReadable: `${bytesReadWritten.readable_bytes_read} read (uncompressed)`,
        targetReadable: `${bytesReadWritten.readable_bytes_written} written (uncompressed)`,
      })
    } else {
      result.push({
        current: bytesReadWritten.bytes_written,
        target: bytesReadWritten.bytes_read,
        currentReadable: `${bytesReadWritten.readable_bytes_written} written (uncompressed)`,
        targetReadable: `${bytesReadWritten.readable_bytes_read} read (uncompressed)`,
      })
    }

    result.push({
      current: used.memory_usage,
      target: totalMem.total,
      currentReadable: `${used.readable_memory_usage} memory used`,
      targetReadable: `${totalMem.readable_total} total`,
    })

    return result
  }, [usedData, totalMemData, rowsData, bytesData])

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} />
  }

  const used = usedData?.[0]
  const totalMem = totalMemData?.[0]
  const rowsReadWritten = rowsData?.[0]

  if (!used || !totalMem || !rowsReadWritten) {
    return null
  }

  const query = `
    Current memory used by merges:
    ${USED_SQL}

    Total memory used by merges estimated from CGroupMemoryUsed or OSMemoryTotal:
    ${TOTAL_MEM_SQL}

    Rows read and written by merges:
    ${ROWS_READ_WRITTEN_SQL}

    Bytes read and written by merges:
    ${BYTES_READ_WRITTEN_SQL}
  `

  return (
    <ChartCard title={title} className={className} sql={query}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <div className="flex flex-col">
              <div>{rowsReadWritten.readable_rows_read} rows read</div>
              <div className="flex flex-row items-center gap-2">
                {used.readable_memory_usage} memory used for merges
                <Link href={`/${hostFromPath}/merges`} className="inline">
                  <ArrowRightIcon className="size-5" />
                </Link>
              </div>
            </div>
          }
          items={items}
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
