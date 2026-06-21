import type { ChartProps } from '@/components/charts/chart-props'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { STUCK_THRESHOLD_SECONDS } from '@/lib/query-config/merges/mutations'
import { REFRESH_INTERVAL, useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'
import {
  STATUS_BADGE_CLASS,
  STATUS_ROW_CLASS,
  type StatusTone,
} from '@/lib/utils/status-badge-class'

type DataRow = {
  mutation_id: string
  table_path: string
  command: string
  parts_to_do: number
  readable_parts_to_do: string
  status: 'running' | 'waiting' | 'done'
  elapsed_seconds: number
  readable_elapsed: string
  latest_fail_reason: string
}

function getMutationTone(row: DataRow): StatusTone {
  if (
    row.elapsed_seconds > STUCK_THRESHOLD_SECONDS &&
    row.status === 'running'
  ) {
    return 'error'
  }
  if (row.status === 'waiting') {
    return 'caution'
  }
  return 'info'
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

export const ChartMutationProgress = function ChartMutationProgress({
  title,
  className,
  chartCardContentClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'mutation-progress',
    hostId,
    refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
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
              contentClassName={chartCardContentClassName}
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
            contentClassName={chartCardContentClassName}
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                <span>Table / Command</span>
                <span className="text-right">Status</span>
                <span className="text-right">Parts Left</span>
                <span className="text-right">Elapsed</span>
              </div>
              {rows.map((row) => {
                const tone = getMutationTone(row)
                return (
                  <div
                    key={row.mutation_id}
                    className={cn(
                      'grid grid-cols-[1fr_60px_80px_80px] gap-2 rounded px-2 py-1.5',
                      'text-xs',
                      STATUS_ROW_CLASS[tone] || 'bg-muted/40'
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
                          ? `${row.command.slice(0, 80)}...`
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
                          STATUS_BADGE_CLASS[tone]
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
                )
              })}
            </div>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
}

export default ChartMutationProgress
