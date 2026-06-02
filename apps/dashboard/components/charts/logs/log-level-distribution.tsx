'use client'

import { createCustomChart } from '@/components/charts/factory'
import { ProportionList } from '@/components/charts/primitives/proportion-list'

interface LogLevelData {
  level: string
  count: number
}

const levelColors: Record<string, string> = {
  Fatal: 'bg-red-700',
  Critical: 'bg-red-500',
  Error: 'bg-orange-500',
  Warning: 'bg-yellow-500',
  Notice: 'bg-blue-500',
  Information: 'bg-emerald-500',
  Debug: 'bg-gray-500',
  Trace: 'bg-gray-400',
}

export const ChartLogLevelDistribution = createCustomChart({
  chartName: 'log-level-distribution',
  defaultTitle: 'Log Level Distribution',
  defaultLastHours: 24,
  dataTestId: 'log-level-distribution-chart',
  dateRangeConfig: 'realtime',
  render: (dataArray) => {
    const data = dataArray as LogLevelData[]

    return (
      <ProportionList
        items={data.map((d, index) => ({
          label: d.level,
          value: d.count,
          colorClass: levelColors[d.level] ?? `bg-chart-${(index % 5) + 1}`,
        }))}
        emptyMessage="No log level data available"
      />
    )
  },
})

export default ChartLogLevelDistribution
