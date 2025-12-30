'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
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
import { ChartSkeleton, ChartError } from '@/components/charts'
import { cn } from '@/lib/utils'

export const ChartZookeeperSummaryTable = memo(
  function ChartZookeeperSummaryTable({
    title = 'ZooKeeper Current Metrics',
    className,
    hostId,
  }: ChartProps) {
    const { data, error, isLoading, refresh, sql } = useChartData<{
      metric: string
      value: string
      desc: string
    }>({
      chartName: 'zookeeper-summary-table',
      hostId,
      refreshInterval: 30000,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) {
      return <ChartSkeleton title={title} className={className} />
    }

    if (error) {
      return (
        <ChartError
          title={title}
          error={error}
          onRetry={refresh}
          className={className}
        />
      )
    }

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

export default ChartZookeeperSummaryTable
