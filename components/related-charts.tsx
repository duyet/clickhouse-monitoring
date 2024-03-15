import { ComponentType } from 'react'

import { type ChartProps } from '@/components/charts/chart-props'
import { type QueryConfig } from '@/lib/types/query-config'
import { cn } from '@/lib/utils'

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

  const col = charts.length > maxChartsPerRow ? maxChartsPerRow : charts.length
  const gridCols = `grid-cols-1 md:grid-cols-${col}`

  return (
    <div className={cn('mb-5 grid gap-5', gridCols, className)}>
      {charts.map(([Chart, props], i) => (
        <ServerComponentLazy key={i}>
          <Chart
            className="w-full p-0 shadow-none"
            chartClassName="h-44"
            {...props}
          />
        </ServerComponentLazy>
      ))}
    </div>
  )
}
