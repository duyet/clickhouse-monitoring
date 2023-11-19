import { ComponentType } from 'react'

import type { QueryConfig } from '@/lib/types/query-config'
import { cn } from '@/lib/utils'
import type { ChartProps } from '@/components/charts/chart-props'

interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  className?: string
}

export async function RelatedCharts({
  relatedCharts,
  className,
}: RelatedChartsProps) {
  // Related charts
  const charts: [ComponentType<ChartProps>, ChartProps][] = []

  if (!relatedCharts) return null

  for (const chart of relatedCharts) {
    let component,
      props = {}

    if (typeof chart === 'string') {
      component = chart
    } else if (Array.isArray(chart)) {
      component = chart[0]
      props = chart[1]
    }

    const chartsModule = await import(`@/components/charts/${component}`)
    charts.push([chartsModule.default, props])
  }

  const chartWidth = charts.length > 1 ? `w-1/${charts.length}` : 'w-full'

  return (
    <div className={cn('mb-5 flex flex-row gap-5', className)}>
      {charts.map(([Chart, props], i) => (
        <Chart
          key={i}
          className={cn(chartWidth, 'p-0 shadow-none')}
          chartClassName="h-44"
          {...props}
        />
      ))}
    </div>
  )
}
