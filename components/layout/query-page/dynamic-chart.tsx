/**
 * DynamicChart Component
 *
 * Renders a chart by name from the registry with automatic lazy loading.
 * Displays an error state if the chart is not found in the registry.
 */

'use client'

import { memo } from 'react'

import { getChartComponent } from '@/components/charts/chart-registry'

export interface DynamicChartProps {
  chartName: string
  hostId: number
  chartProps?: Record<string, unknown>
}

export const DynamicChart = memo(function DynamicChart({
  chartName,
  hostId,
  chartProps = {},
}: DynamicChartProps) {
  const ChartComponent = getChartComponent(chartName)

  if (!ChartComponent) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">
          Unknown chart: {chartName}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[180px] flex-col">
      <ChartComponent
        className="w-full p-0 shadow-none"
        chartClassName="h-full min-h-[150px] sm:min-h-[180px]"
        hostId={hostId}
        {...chartProps}
      />
    </div>
  )
})
