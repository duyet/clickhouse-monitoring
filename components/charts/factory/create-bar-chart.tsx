'use client'

import { type FC, memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { useChartData, useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'
import type { ChartDataPoint } from '@/types/chart-data'
import type { BarChartFactoryConfig } from './types'

/**
 * Factory function to create a BarChart component with consistent patterns
 *
 * Eliminates ~45 lines of duplicate code per chart component.
 *
 * @example
 * ```typescript
 * export const ChartQueryType = createBarChart<{
 *   query_type: string
 *   count: number
 * }>({
 *   chartName: 'query-type',
 *   index: 'query_type',
 *   categories: ['count'],
 * })
 * ```
 */
export function createBarChart<T extends ChartDataPoint = ChartDataPoint>(
  config: BarChartFactoryConfig
): FC<ChartProps> {
  return memo(function Chart({
    title = config.defaultTitle,
    interval = config.defaultInterval,
    lastHours = config.defaultLastHours,
    className,
    chartClassName,
    ...props
  }: ChartProps) {
    const hostId = useHostId()
    const swr = useChartData<T>({
      chartName: config.chartName,
      hostId,
      interval,
      lastHours,
      refreshInterval: config.refreshInterval ?? 30000,
    })

    return (
      <ChartContainer
        swr={swr}
        title={title}
        className={className}
        chartClassName={chartClassName}
      >
        {(dataArray, sql) => (
          <ChartCard
            title={title}
            sql={sql}
            data={dataArray}
            data-testid={config.dataTestId}
          >
            <BarChart
              className={cn(
                'h-full w-full',
                chartClassName,
                config.defaultChartClassName
              )}
              data={dataArray}
              index={config.index}
              categories={
                typeof config.categories === 'function'
                  ? config.categories(dataArray)
                  : config.categories
              }
              {...config.barChartProps}
              {...props}
            />
          </ChartCard>
        )}
      </ChartContainer>
    )
  })
}
