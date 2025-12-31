'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartSummaryUsedByMerges = memo(function ChartSummaryUsedByMerges({
  title,
  className,
  hostId,
}: ChartProps) {
  const pathname = usePathname()
  const hostFromPath = pathname.split('/')[1] || '0'

  // Single API call that returns all data combined
  const { data, error, isLoading, sql } = useChartData<{
    used: { memory_usage: number; readable_memory_usage: string }[]
    totalMem: { metric: string; total: number; readable_total: string }[]
    rowsReadWritten: {
      rows_read: number
      rows_written: number
      readable_rows_read: string
      readable_rows_written: string
    }[]
    bytesReadWritten: {
      bytes_read: number
      bytes_written: number
      readable_bytes_read: string
      readable_bytes_written: string
    }[]
  }>({
    chartName: 'summary-used-by-merges',
    hostId,
  })

  const items = useMemo(() => {
    if (!data || data.length === 0) return []

    const firstItem = data[0] as Record<string, unknown> | undefined
    if (!firstItem || typeof firstItem !== 'object') return []

    const used = firstItem.used as
      | { memory_usage: number; readable_memory_usage: string }[]
      | undefined
    const totalMem = firstItem.totalMem as
      | { total: number; readable_total: string }[]
      | undefined
    const rowsReadWritten = firstItem.rowsReadWritten as
      | {
          rows_read: number
          rows_written: number
          readable_rows_read: string
          readable_rows_written: string
        }[]
      | undefined
    const bytesReadWritten = firstItem.bytesReadWritten as
      | {
          bytes_read: number
          bytes_written: number
          readable_bytes_read: string
          readable_bytes_written: string
        }[]
      | undefined

    const usedData = used?.[0]
    const totalMemData = totalMem?.[0]
    const rowsData = rowsReadWritten?.[0] || {
      rows_read: 0,
      rows_written: 0,
      readable_rows_read: '0',
      readable_rows_written: '0',
    }
    const bytesData = bytesReadWritten?.[0] || {
      bytes_read: 0,
      bytes_written: 0,
      readable_bytes_read: '0',
      readable_bytes_written: '0',
    }

    if (!usedData || !totalMemData) return []

    const result: CardMultiMetricsProps['items'] = []

    if (rowsData.rows_read < rowsData.rows_written) {
      result.push({
        current: rowsData.rows_read,
        target: rowsData.rows_written,
        currentReadable: `${rowsData.readable_rows_read} rows read`,
        targetReadable: `${rowsData.readable_rows_written} rows written`,
      })
    } else {
      result.push({
        current: rowsData.rows_written,
        target: rowsData.rows_read,
        currentReadable: `${rowsData.readable_rows_written} rows written`,
        targetReadable: `${rowsData.readable_rows_read} rows read`,
      })
    }

    if (bytesData.bytes_read < bytesData.bytes_written) {
      result.push({
        current: bytesData.bytes_read,
        target: bytesData.bytes_written,
        currentReadable: `${bytesData.readable_bytes_read} read (uncompressed)`,
        targetReadable: `${bytesData.readable_bytes_written} written (uncompressed)`,
      })
    } else {
      result.push({
        current: bytesData.bytes_written,
        target: bytesData.bytes_read,
        currentReadable: `${bytesData.readable_bytes_written} written (uncompressed)`,
        targetReadable: `${bytesData.readable_bytes_read} read (uncompressed)`,
      })
    }

    result.push({
      current: usedData.memory_usage,
      target: totalMemData.total,
      currentReadable: `${usedData.readable_memory_usage} memory used`,
      targetReadable: `${totalMemData.readable_total} total`,
    })

    return result
  }, [data])

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} />
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  const firstItem = data[0] as Record<string, unknown> | undefined
  if (!firstItem || typeof firstItem !== 'object') {
    return <ChartEmpty title={title} className={className} />
  }

  const used = (firstItem.used as
    | { memory_usage: number; readable_memory_usage: string }[]
    | undefined
  )?.[0]
  const totalMem = (firstItem.totalMem as
    | { total: number; readable_total: string }[]
    | undefined
  )?.[0]
  const rowsReadWritten = (firstItem.rowsReadWritten as
    | {
        rows_read: number
        readable_rows_read: string
      }[]
    | undefined
  )?.[0]

  if (!used || !totalMem || !rowsReadWritten) {
    return null
  }

  return (
    <ChartCard title={title} sql={sql} className={className}>
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
})

export default ChartSummaryUsedByMerges
