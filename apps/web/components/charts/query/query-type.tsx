'use client'

import { createCustomChart } from '@/components/charts/factory'
import { ProportionList } from '@/components/charts/primitives/proportion-list'

interface QueryTypeData {
  type: string
  query_count: number
}

const typeColors: Record<string, string> = {
  QueryFinish: 'bg-emerald-500',
  QueryStart: 'bg-blue-500',
  ExceptionBeforeStart: 'bg-red-500',
  ExceptionWhileProcessing: 'bg-orange-500',
}

export const ChartQueryType = createCustomChart({
  chartName: 'query-type',
  defaultTitle: 'Query Type Distribution',
  defaultLastHours: 24,
  dataTestId: 'query-type-chart',
  dateRangeConfig: 'realtime',
  render: (dataArray) => {
    const data = dataArray as QueryTypeData[]

    return (
      <ProportionList
        items={data.map((d, index) => ({
          label: d.type,
          value: d.query_count,
          colorClass: typeColors[d.type] ?? `bg-chart-${(index % 5) + 1}`,
        }))}
        emptyMessage="No query type data available"
      />
    )
  },
})

export default ChartQueryType
