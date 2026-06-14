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

// Static fallback palette for unknown levels. Listed as full class literals so
// Tailwind's content scanner emits them — a `bg-chart-${n}` template would be
// constructed at runtime and stripped from the production build.
const fallbackColors = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
]

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
          colorClass: levelColors[d.level] ?? fallbackColors[index % 5],
        }))}
        emptyMessage="No log level data available"
      />
    )
  },
})

export default ChartLogLevelDistribution
