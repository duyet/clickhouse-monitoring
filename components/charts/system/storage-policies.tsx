'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { useChartData, useHostId } from '@/lib/swr'

type DataRow = {
  policy_name: string
  volume_name: string
  disks: string[]
  volume_priority: number
  prefer_not_to_merge: number
}

const CHART_NAME = 'storage-policies'
const DEFAULT_TITLE = 'Storage Policies'

export const ChartStoragePolicies = memo(function ChartStoragePolicies({
  title = DEFAULT_TITLE,
  className,
  chartClassName,
}: ChartProps) {
  const hostId = useHostId()
  const swr = useChartData<DataRow>({
    chartName: CHART_NAME,
    hostId,
    refreshInterval: 300000,
  })

  return (
    <ChartContainer
      swr={swr}
      title={title}
      className={className}
      chartClassName={chartClassName}
    >
      {(dataArray, sql, metadata, staleError, mutate) => {
        const rows = dataArray as DataRow[]

        return (
          <ChartCard
            title={title}
            sql={sql}
            data={rows}
            metadata={metadata}
            data-testid="storage-policies-chart"
            staleError={staleError}
            onRetry={mutate}
          >
            <div className="w-full overflow-auto">
              <div className="min-w-[480px]">
                <div className="grid grid-cols-[1fr_1fr_2fr_auto_auto] gap-x-4 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>Policy</span>
                  <span>Volume</span>
                  <span>Disks</span>
                  <span className="text-right">Priority</span>
                  <span className="text-right">No Merge</span>
                </div>
                {rows.map((row, i) => (
                  <div
                    key={`${row.policy_name}-${row.volume_name}-${i}`}
                    className="grid grid-cols-[1fr_1fr_2fr_auto_auto] gap-x-4 border-b py-2 text-sm last:border-0"
                  >
                    <span className="font-medium">{row.policy_name}</span>
                    <span className="text-muted-foreground">
                      {row.volume_name}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {Array.isArray(row.disks)
                        ? row.disks.join(', ')
                        : String(row.disks)}
                    </span>
                    <span className="text-right tabular-nums">
                      {row.volume_priority}
                    </span>
                    <span className="text-right">
                      {row.prefer_not_to_merge ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No storage policies configured
                  </div>
                )}
              </div>
            </div>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export type ChartStoragePoliciesProps = ChartProps

export default ChartStoragePolicies
