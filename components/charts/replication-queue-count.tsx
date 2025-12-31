'use client'

import { createCustomChart } from '@/components/charts/factory'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartReplicationQueueCount = createCustomChart<{
  count_all: number
  count_executing: number
}>({
  chartName: 'replication-queue-count',
  dataTestId: 'replication-queue-count-chart',
  chartCardClassName: 'justify-between',
  render: (dataArray) => {
    const count = dataArray[0] as {
      count_all: number
      count_executing: number
    }

    return (
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2">
              {count.count_executing} executing
            </span>
          }
          items={[]}
          className="p-2"
        />
        <div className="text-muted-foreground pl-2 text-sm">
          {count.count_all} in total
        </div>
      </div>
    )
  },
})

export type ChartReplicationQueueCountProps = ChartProps

export default ChartReplicationQueueCount
