'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/generic-charts/card-multi-metrics'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { formatReadableQuantity } from '@/lib/format-readable'
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

    const items = useMemo(() => {
      if (!data || typeof data !== 'object') return []

      const main = (data as Record<string, unknown>).main as
        | {
            query_count: number
            memory_usage: number
            readable_memory_usage: string
          }[]
        | undefined
      const totalMem = (data as Record<string, unknown>).totalMem as
        | { total: number; readable_total: string }[]
        | undefined
      const todayQueryCount = (data as Record<string, unknown>)
        .todayQueryCount as { query_count: number }[] | undefined
      const rowsReadWritten = (data as Record<string, unknown>)
        .rowsReadWritten as
        | {
            rows_read: number
            rows_written: number
            readable_rows_read: string
            readable_rows_written: string
          }[]
        | undefined

      const first = main?.[0]
      const totalMemData = totalMem?.[0]
      const todayQueryCountData =
        todayQueryCount?.[0]?.query_count ?? first?.query_count ?? 0
      const rowsData = rowsReadWritten?.[0] || {
        rows_read: 0,
        rows_written: 0,
        readable_rows_read: '0',
        readable_rows_written: '0',
      }

      if (!first || !totalMemData) return []

      const result: CardMultiMetricsProps['items'] = []

      result.push({
        current: first.memory_usage,
        target: totalMemData.total,
        currentReadable: `${first.readable_memory_usage} memory usage`,
        targetReadable: `${totalMemData.readable_total} total`,
      })

      result.push({
        current: first.query_count,
        target: todayQueryCountData,
        currentReadable: `${first.query_count} running queries`,
        targetReadable: `${formatReadableQuantity(todayQueryCountData)} today`,
      })

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

      return result
    }, [data])

    if (isLoading) {
      return <ChartSkeleton title={title} className={className} />
    }

    if (error) {
      return <ChartError error={error} title={title} />
    }

    // Show empty state if no data
    if (!data || typeof data !== 'object') {
      return <ChartEmpty title={title} className={className} />
    }

    const first = (
      (data as Record<string, unknown>).main as
        | { query_count: number; readable_memory_usage: string }[]
        | undefined
    )?.[0]

    if (!first) {
      return null
    }

    return (
      <ChartCard title={title} sql={sql} className={className}>
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
)

export default ChartSummaryUsedByRunningQueries
