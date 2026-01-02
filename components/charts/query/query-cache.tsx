'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { CardMetric } from '@/components/cards/card-metric'
import { createCustomChart } from '@/components/charts/factory'

export const ChartQueryCache = createCustomChart({
  chartName: 'query-cache',
  defaultTitle: 'Query Cache',
  render: (dataArray) => {
    const first = dataArray[0] as {
      total_result_size: number
      total_staled_result_size: number
      readable_total_result_size: string
      readable_total_staled_result_size: string
    }

    return (
      <CardMetric
        current={first.total_result_size}
        currentReadable={`${first.readable_total_result_size} cached`}
        target={first.total_staled_result_size}
        targetReadable={`${first.readable_total_staled_result_size} staled`}
        className="p-2"
      />
    )
  },
})

export type ChartQueryCacheProps = ChartProps

export default ChartQueryCache
