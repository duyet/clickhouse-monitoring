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
import { formatReadableQuantity } from '@/lib/format-readable'
import {
  extractNestedData,
  transformRunningQueriesSummaryData,
} from '@/lib/chart-data-transforms'
import { useChartData } from '@/lib/swr'

export const ChartSummaryUsedByRunningQueries = memo(
  function ChartSummaryUsedByRunningQueries({
    title,
    className,
    hostId,
  }: ChartProps) {
    const pathname = usePathname()
    const hostFromPath = pathname.split('/')[1] || '0'

    // Single API call that returns all data combined
    const { data, error, isLoading, sql } = useChartData<{
      main: {
        query_count: number
        memory_usage: number
        readable_memory_usage: string
      }[]
      totalMem: { metric: string; total: number; readable_total: string }[]
      todayQueryCount: { query_count: number }[]
      rowsReadWritten: {
        rows_read: number
        rows_written: number
        readable_rows_read: string
        readable_rows_written: string
      }[]
    }>({
      chartName: 'summary-used-by-running-queries',
      hostId,
    })

    const transformedData = useMemo(() => {
      if (!data || data.length === 0) return null

      const summaryData = {
        main: extractNestedData<{
          query_count: number
          memory_usage: number
          readable_memory_usage: string
        }>(data, 'main'),
        totalMem: extractNestedData<{
          metric: string
          total: number
          readable_total: string
        }>(data, 'totalMem'),
        todayQueryCount: extractNestedData<{
          query_count: number
        }>(data, 'todayQueryCount'),
        rowsReadWritten: extractNestedData<{
          rows_read: number
          rows_written: number
          readable_rows_read: string
          readable_rows_written: string
        }>(data, 'rowsReadWritten'),
      }

      const baseResult = transformRunningQueriesSummaryData(summaryData)
      if (!baseResult) return null

      // Override the today query count with formatted version
      const todayQueryCount = summaryData.todayQueryCount?.[0]?.query_count
      const queryCount = summaryData.main?.[0]?.query_count ?? 0

      return {
        ...baseResult,
        items: baseResult.items.map((item, index) => {
          // Update the second item (query count comparison) with formatted values
          if (index === 1) {
            return {
              ...item,
              targetReadable: `${formatReadableQuantity(todayQueryCount ?? queryCount)} today`,
            }
          }
          return item
        }),
      }
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

    const queryCount =
      (transformedData.raw.used as { query_count?: number })?.query_count ?? 0

    return (
      <ChartCard title={title} sql={sql} className={className}>
        <div className="flex flex-col justify-between p-0">
          <CardMultiMetrics
            primary={
              <div className="flex flex-col">
                <div>{queryCount} queries</div>
                <div className="flex flex-row items-center gap-2">
                  {transformedData.primary.memoryUsage}{' '}
                  {transformedData.primary.description}
                  <Link
                    href={`/${hostFromPath}/running-queries`}
                    className="inline"
                  >
                    <ArrowRightIcon className="size-5" />
                  </Link>
                </div>
              </div>
            }
            items={transformedData.items}
            className="p-2"
          />
          <div className="text-muted-foreground text-right text-sm"></div>
        </div>
      </ChartCard>
    )
  }
)

export default ChartSummaryUsedByRunningQueries
