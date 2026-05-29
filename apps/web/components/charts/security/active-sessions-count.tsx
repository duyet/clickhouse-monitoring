'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createCustomChart } from '@/components/charts/factory'

interface ActiveSessionsData {
  active_count: number
  unique_users: number
}

export const ChartActiveSessionsCount = createCustomChart({
  chartName: 'active-sessions-count',
  defaultTitle: 'Active Sessions',
  dataTestId: 'active-sessions-count-chart',
  render: (dataArray) => {
    const row = (dataArray[0] as ActiveSessionsData) ?? {
      active_count: 0,
      unique_users: 0,
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 h-full min-h-[120px]">
        <div className="flex gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-semibold tabular-nums">
              {row.active_count.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Active Sessions
            </span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-semibold tabular-nums">
              {row.unique_users.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Unique Users
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sessions active in the last hour
        </p>
      </div>
    )
  },
})

export type ChartActiveSessionsCountProps = ChartProps

export default ChartActiveSessionsCount
