'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { STUCK_THRESHOLD_SECONDS } from '@/lib/query-config/merges/mutations'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

type DataRow = {
  table_path: string
  command: string
  parts_to_do: number
  readable_parts_to_do: string
  status: 'running' | 'waiting' | 'done'
  elapsed_seconds: number
  readable_elapsed: string
  latest_fail_reason: string
}

function getStatusBadgeClass(row: DataRow): string {
  if (
    row.elapsed_seconds > STUCK_THRESHOLD_SECONDS &&
    row.status === 'running'
  ) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }
  if (row.status === 'waiting') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
}

function getStatusLabel(row: DataRow): string {
  if (
    row.elapsed_seconds > STUCK_THRESHOLD_SECONDS &&
    row.status === 'running'
  ) {
    return 'stuck'
  }
  return row.status
}

export const ChartMutationProgress = memo(function ChartMutationProgress({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'mutation-progress',
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata, staleError, mutate) => {
        const rows = dataArray as DataRow[]

        if (rows.length === 0) {
          return (
            <ChartCard
              title={title}
              className={className}
              sql={sql}
              data={rows}
              metadata={metadata}
              staleError={staleError}
              onRetry={mutate}
            >
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No active mutations
              </div>
            </ChartCard>
          )
        }

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={rows}
            metadata={metadata}
            staleError={staleError}
            onRetry={mutate}
          >
            <div className="flex flex-col gap-1 text-xs">
              <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-2 py-1 font-medium text-muted-foreground">
                <span>Table / Command</span>
                <span className="text-right">Status</span>
                <span className="text-right">Parts Left</span>
                <span className="text-right">Elapsed</span>
              </div>
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={cn(
                    'grid grid-cols-[1fr_60px_80px_80px] gap-2 rounded px-2 py-1.5',
                    row.elapsed_seconds > STUCK_THRESHOLD_SECONDS &&
                      row.status === 'running'
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : row.status === 'waiting'
                        ? 'bg-amber-50 dark:bg-amber-950/20'
                        : 'bg-muted/40'
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {row.table_path}
                    </div>
                    <div
                      className="truncate text-muted-foreground"
                      title={row.command}
                    >
                      {row.command.length > 80
                        ? row.command.slice(0, 80) + '...'
                        : row.command}
                    </div>
                    {row.latest_fail_reason && (
                      <div
                        className="truncate text-red-600 dark:text-red-400"
                        title={row.latest_fail_reason}
                      >
                        {row.latest_fail_reason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-end pt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                        getStatusBadgeClass(row)
                      )}
                    >
                      {getStatusLabel(row)}
                    </span>
                  </div>
                  <div className="flex items-start justify-end pt-1 tabular-nums text-foreground">
                    {row.readable_parts_to_do}
                  </div>
                  <div className="flex items-start justify-end pt-1 tabular-nums text-muted-foreground">
                    {row.readable_elapsed}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartMutationProgress
