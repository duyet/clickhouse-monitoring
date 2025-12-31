'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { createCustomChart } from '@/components/charts/factory'
import { AreaChart } from '@/components/charts/primitives/area'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartMergeCount = createCustomChart<{
  event_time: string
  avg_CurrentMetric_Merge: number
  avg_CurrentMetric_PartMutation: number
}>({
  chartName: 'merge-count',
  defaultInterval: 'toStartOfFiveMinutes',
  defaultLastHours: 12,
  dataTestId: 'merge-count-chart',
  chartCardClassName: 'justify-between',
  contentClassName: 'flex flex-col justify-between',
  render: (dataArray, sql, hostId) => (
    <>
      <AreaChart
        className="h-52"
        data={dataArray as Array<{
          event_time: string
          avg_CurrentMetric_Merge: number
          avg_CurrentMetric_PartMutation: number
        }>}
        index="event_time"
        categories={[
          'avg_CurrentMetric_Merge',
          'avg_CurrentMetric_PartMutation',
        ]}
        readable="quantity"
      />

      <div className="text-muted-foreground flex flex-row justify-between gap-2 text-right text-sm">
        <Link
          href={`/merges?host=${hostId}`}
          className="flex flex-row items-center gap-2"
        >
          Merges
          <ArrowRightIcon className="size-3" />
        </Link>
        <Link
          href={`/mutations?host=${hostId}`}
          className="flex flex-row items-center gap-2"
        >
          Mutations
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </>
  ),
})

export type ChartMergeCountProps = ChartProps

export default ChartMergeCount
