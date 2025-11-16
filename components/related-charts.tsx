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
  const charts: [
    ChartName,
    ComponentType<ChartProps>,
    Omit<ChartProps, 'hostId'>,
  ][] = []

  if (!relatedCharts) return null

  // Load all chart modules in parallel for better performance
  const chartLoadPromises = relatedCharts.map(async (chart) => {
    let component: string | undefined,
      props: Omit<ChartProps, 'hostId'> = {}

    if (!chart) return null

    if (typeof chart === 'string') {
      component = chart
    } else if (Array.isArray(chart)) {
      component = chart[0]
      props = chart[1]
    }

    if (!component) {
      return null
    }

    try {
      const chartsModule = await import(`@/components/charts/${component}`)
      return [component, chartsModule.default, props] as [
        ChartName,
        ComponentType<ChartProps>,
        Omit<ChartProps, 'hostId'>,
      ]
    } catch (error) {
      console.error(`Failed to load chart component: ${component}`, error)
      return null
    }
  })

  // Wait for all charts to load in parallel
  const loadedCharts = await Promise.all(chartLoadPromises)

  // Filter out null values (failed or skipped charts)
  charts.push(...loadedCharts.filter((c): c is NonNullable<typeof c> => c !== null))

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
          className = 'col-span-2'
        }

        // If this is the last chart, but still have space in the row, add a 'col-span-2' class
        // Note: Currently optimized for maxChartsPerRow = 2 (most common case)
        // For example:
        // relatedCharts: [['chart1', {}], ['chart2', {}], ['chart3', {}]]]
        // -----------------------
        // | chart1   |  chart2  |
        // |       chart3        |
        // -----------------------
        if (charts.length > 2 && i === charts.length - 1 && col === 2) {
          className = 'auto-cols-max'
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
