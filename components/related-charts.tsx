import { ComponentType } from 'react'

import { type ChartProps } from '@/components/charts/chart-props'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import { ChartSkeleton } from '@/components/skeleton'
import { cn } from '@/lib/utils'
import { type QueryConfig } from '@/types/query-config'

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
  const charts: [ChartName, ComponentType<ChartProps>, Omit<ChartProps, 'hostId'>][] = []

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
      console.warn('Component not found for chart:', chart)
      continue
    }

    const chartsModule = await import(`@/components/charts/${component}`)
    charts.push([component, chartsModule.default, props])
  }

  const col = charts.length > maxChartsPerRow ? maxChartsPerRow : charts.length
  const gridCols = `grid-cols-1 md:grid-cols-${col}`

  return (
    <div className={cn('grid gap-5', gridCols, className)}>
      {charts.map(([name, Chart, props], i) => {
        let className = ''

        // If next chart is a break, add a 'col-span-2' class to the current chart
        // For example:
        // relatedCharts: [['chart1', {}], 'break', ['chart2', {}], ['chart3', {}]]]
        // -----------------------
        // |        chart1       |
        // | chart2   |  chart3  |
        // -----------------------
        if (charts[i + 1] && charts[i + 1][0] === 'break') {
          console.debug(
            `${name} add col-span-2 due to next chart being a break`
          )
          className = 'col-span-2'
        }

        // If this is the last chart, but still have space in the row, add a 'col-span-2' class
        // TODO: implement for maxChartsPerRow > 2
        // For example:
        // relatedCharts: [['chart1', {}], ['chart2', {}], ['chart3', {}]]]
        // -----------------------
        // | chart1   |  chart2  |
        // |       chart3        |
        // -----------------------
        if (charts.length > 2 && i === charts.length - 1 && col === 2) {
          className = 'auto-cols-max'
          console.debug(
            `${name} add classname ${className} due to this chart is at the end of the row`
          )
        }

        return (
          <ServerComponentLazy
            key={name + props.title}
            fallback={<ChartSkeleton />}
          >
            <Chart
              className={cn('w-full p-0 shadow-none', className)}
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
