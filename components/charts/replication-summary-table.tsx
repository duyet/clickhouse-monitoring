'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { ChartCard } from '@/components/generic-charts/chart-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartReplicationSummaryTable = memo(
  function ChartReplicationSummaryTable({
    title,
    className,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, refresh, sql } = useChartData<{
      table: string
      type: string
      current_executing: number
      total: number
    }>({
      chartName: 'replication-summary-table',
      hostId,
      refreshInterval: 30000,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error)
      return <ChartError error={error} title={title} onRetry={refresh} />

    // Show empty state if no data
    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const headers = Object.keys(dataArray[0])

    return (
      <ChartCard
        title={title}
        className={cn('justify-between', className)}
        sql={sql}
        data={dataArray}
      >
        <div className="flex flex-col justify-between p-0">
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataArray.map((row, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((value, i) => {
                    return <TableCell key={i}>{value || ''} </TableCell>
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    )
  }
)

export default ChartReplicationSummaryTable
