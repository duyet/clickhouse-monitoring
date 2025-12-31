'use client'

import { CardMetric } from '@/components/cards/card-metric'
import type { ChartProps } from '@/components/charts/chart-props'
import { createCustomChart } from '@/components/charts/factory'

export const ChartDiskSize = createCustomChart<{
  name: string
  used_space: number
  readable_used_space: string
  total_space: number
  readable_total_space: string
}>({
  chartName: 'disk-size',
  dataTestId: 'disk-size-chart',
  render: (dataArray) => {
    const first = dataArray[0] as {
      name: string
      used_space: number
      readable_used_space: string
      total_space: number
      readable_total_space: string
    }

    return (
      <CardMetric
        current={first.used_space}
        currentReadable={`${first.readable_used_space} used (${first.name})`}
        target={first.total_space}
        targetReadable={`${first.readable_total_space} total`}
        className="p-2"
      />
    )
  },
})

export type ChartDiskSizeProps = ChartProps

export default ChartDiskSize
