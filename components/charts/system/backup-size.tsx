'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { CardMetric } from '@/components/cards/card-metric'
import { createCustomChart } from '@/components/charts/factory'

export const ChartBackupSize = createCustomChart({
  chartName: 'backup-size',
  dataTestId: 'backup-size-chart',
  render: (dataArray) => {
    const first = dataArray[0] as {
      total_size: number
      uncompressed_size: number
      compressed_size: number
      readable_total_size: string
      readable_uncompressed_size: string
      readable_compressed_size: string
    }

    return (
      <CardMetric
        current={first.compressed_size}
        currentReadable={`${first.readable_compressed_size} compressed`}
        target={first.uncompressed_size}
        targetReadable={`${first.readable_uncompressed_size} uncompressed`}
        className="p-2"
      />
    )
  },
})

export type ChartBackupSizeProps = ChartProps

export default ChartBackupSize
