'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import {
  extractNestedData,
  transformMergeSummaryData,
} from '@/lib/chart-data-transforms'
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

  const transformedData = useMemo(() => {
    if (!data || data.length === 0) return null

    const summaryData = {
      used: extractNestedData<{
        memory_usage: number
        readable_memory_usage: string
      }>(data, 'used'),
      totalMem: extractNestedData<{
        metric: string
        total: number
        readable_total: string
      }>(data, 'totalMem'),
      rowsReadWritten: extractNestedData<{
        rows_read: number
        rows_written: number
        readable_rows_read: string
        readable_rows_written: string
      }>(data, 'rowsReadWritten'),
      bytesReadWritten: extractNestedData<{
        bytes_read: number
        bytes_written: number
        readable_bytes_read: string
        readable_bytes_written: string
      }>(data, 'bytesReadWritten'),
    }

    return transformMergeSummaryData(summaryData)
  }, [data])

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} />
  }

  // Show empty state if no data or transformation failed
  if (!data || data.length === 0 || !transformedData) {
    return <ChartEmpty title={title} className={className} />
  }

  return (
    <ChartCard title={title} sql={sql} className={className}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <div className="flex flex-col">
              <div>
                {transformedData.raw.rowsReadWritten.readable_rows_read} rows
                read
              </div>
              <div className="flex flex-row items-center gap-2">
                {transformedData.primary.memoryUsage}{' '}
                {transformedData.primary.description}
                <Link href={`/${hostFromPath}/merges`} className="inline">
                  <ArrowRightIcon className="size-5" />
                </Link>
              </div>
            </div>
          }
          items={transformedData.items}
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
