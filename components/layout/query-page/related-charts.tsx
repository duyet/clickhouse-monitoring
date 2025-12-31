/**
 * RelatedCharts Component
 *
 * Renders a responsive grid of charts based on queryConfig.relatedCharts.
 *
 * Responsive layout based on chart count:
 * - 1 chart → full width
 * - 2 charts → 1 col (mobile) → 2 col (md)
 * - 3 charts → 1 col → 2 col (md) → 3 col (xl)
 * - 4 charts → 1 col → 2 col (md) → 4 col (xl)
 * - 5+ charts → flex-col stacked
 *
 * Equal card heights achieved with h-full on grid items.
 */

'use client'

import { memo, Suspense } from 'react'

import { ChartSkeleton } from '@/components/skeletons'
import { DynamicChart } from './dynamic-chart'
import type { QueryConfig } from '@/types/query-config'
import { cn } from '@/lib/utils'

export interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  hostId: number
  gridClass?: string
}

export const RelatedCharts = memo(function RelatedCharts({
  relatedCharts,
  hostId,
  gridClass,
}: RelatedChartsProps) {
  if (!relatedCharts || relatedCharts.length === 0) {
    return null
  }

  // Filter out 'break' directives for counting
  const chartCount = relatedCharts.filter(
    (c) => c && c !== 'break'
  ).length

  // For 5+ charts, use flex-col for stacked layout
  if (chartCount >= 5) {
    return (
      <div className={cn('flex flex-col gap-3', gridClass)}>
        {relatedCharts.map((chartConfig, index) => {
          if (!chartConfig) return null
          if (typeof chartConfig === 'string' && chartConfig === 'break') {
            return null
          }

          const chartName = Array.isArray(chartConfig)
            ? chartConfig[0]
            : chartConfig
          const chartProps = Array.isArray(chartConfig)
            ? chartConfig[1] || {}
            : {}

          return (
            <div key={`${chartName}-${index}`} className="h-full">
              <Suspense fallback={<ChartSkeleton />}>
                <DynamicChart
                  chartName={chartName}
                  hostId={hostId}
                  chartProps={chartProps}
                />
              </Suspense>
            </div>
          )
        })}
      </div>
    )
  }

  // Responsive grid layout based on chart count
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  }
  const gridCols = gridColsMap[chartCount] || 'grid-cols-1 md:grid-cols-2'

  return (
    <div className={cn('grid auto-rows-fr gap-3', gridCols, gridClass)}>
      {relatedCharts.map((chartConfig, index) => {
        if (!chartConfig) return null

        // Handle break directive
        if (typeof chartConfig === 'string' && chartConfig === 'break') {
          return <div key={`break-${index}`} className="hidden" />
        }

        // Extract chart name and props
        const chartName = Array.isArray(chartConfig)
          ? chartConfig[0]
          : chartConfig
        const chartProps = Array.isArray(chartConfig)
          ? chartConfig[1] || {}
          : {}

        return (
          <div key={`${chartName}-${index}`} className="h-full">
            <Suspense fallback={<ChartSkeleton />}>
              <DynamicChart
                chartName={chartName}
                hostId={hostId}
                chartProps={chartProps}
              />
            </Suspense>
          </div>
        )
      })}
    </div>
  )
})
