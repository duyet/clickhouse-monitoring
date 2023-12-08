import { ComponentType } from 'react'

import type { QueryConfig } from '@/lib/types/query-config'
import { cn } from '@/lib/utils'
import type { ChartProps } from '@/components/charts/chart-props'

import { ServerComponentLazy } from './server-component-lazy'

interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  maxChartsPerRow?: number
  className?: string
}

export async function RelatedCharts({
  relatedCharts,
  maxChartsPerRow = 2,
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

  const w = charts.length > maxChartsPerRow ? maxChartsPerRow : charts.length
  const chartWidth = charts.length > 1 ? `w-full md:w-1/${w}` : 'w-full'

  return (
    <div className={cn('mb-5 flex flex-col gap-5 md:flex-row', className)}>
      {charts.map(([Chart, props], i) => (
        <ServerComponentLazy key={i}>
          <Chart
            className={cn(chartWidth, 'p-0 shadow-none')}
            chartClassName="h-44"
            {...props}
          />
        </ServerComponentLazy>
      ))}
    </div>
  )
}
