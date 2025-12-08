import type { ComponentType } from 'react'

import type { ChartProps } from '@/components/charts/chart-props'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import { ChartSkeleton } from '@/components/skeleton'
import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'

interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  maxChartsPerRow?: number
  className?: string
  hostId: number
}

export async function RelatedCharts({
  relatedCharts,
  maxChartsPerRow = 2,
  className,
  hostId,
}: RelatedChartsProps) {
  // Related charts
  type ChartName = string
  const charts: [
    ChartName,
    ComponentType<ChartProps>,
    Omit<ChartProps, 'hostId'>,
  ][] = []

  if (!relatedCharts) return null

  for (const chart of relatedCharts) {
    let component,
      props: Omit<ChartProps, 'hostId'> = {}

    if (!chart) continue

    if (typeof chart === 'string') {
      component = chart
    } else if (Array.isArray(chart)) {
      component = chart[0]
      props = chart[1]
    }

    if (!component) {
      // Component not found for chart, skip it
      continue
    }

    const chartsModule = await import(`@/components/charts/${component}`)
    charts.push([component, chartsModule.default, props])
  }

  const col = charts.length > maxChartsPerRow ? maxChartsPerRow : charts.length

  // Use a mapping object for Tailwind classes to ensure they're included in the build
  // Dynamic class generation doesn't work with Tailwind's JIT compiler
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4',
  }
  const gridCols = gridColsMap[col] || 'grid-cols-1 md:grid-cols-2'

  // Column span mapping for last chart spanning remaining space
  const colSpanMap: Record<number, string> = {
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  }

  return (
    <div className={cn('grid gap-5', gridCols, className)}>
      {charts.map(([name, Chart, props], i) => {
        let chartClassName = ''

        // If next chart is a break, span remaining columns
        // Example with maxChartsPerRow=2:
        // relatedCharts: [['chart1', {}], 'break', ['chart2', {}], ['chart3', {}]]]
        // -----------------------
        // |        chart1       |
        // | chart2   |  chart3  |
        // -----------------------
        if (charts[i + 1] && charts[i + 1][0] === 'break') {
          chartClassName = colSpanMap[maxChartsPerRow] || 'md:col-span-2'
        }

        // If this is the last chart and doesn't fill the row, span remaining columns
        // Works for any maxChartsPerRow value
        // Example with maxChartsPerRow=2, 3 charts:
        // -----------------------
        // | chart1   |  chart2  |
        // |       chart3        |
        // -----------------------
        // Example with maxChartsPerRow=3, 4 charts:
        // -------------------------------
        // | chart1  | chart2  | chart3  |
        // |          chart4             |
        // -------------------------------
        const isLastChart = i === charts.length - 1
        const totalCharts = charts.length
        const positionInRow = totalCharts % maxChartsPerRow

        if (isLastChart && positionInRow !== 0 && totalCharts > 1) {
          // Calculate remaining columns to span
          const remainingCols = maxChartsPerRow - positionInRow + 1
          chartClassName = colSpanMap[remainingCols] || ''
        }

        return (
          <ServerComponentLazy
            key={name + props.title}
            fallback={<ChartSkeleton />}
          >
            <Chart
              className={cn('w-full p-0 shadow-none', chartClassName)}
              chartClassName="h-44"
              {...props}
              hostId={hostId}
            />
          </ServerComponentLazy>
        )
      })}
    </div>
  )
}
