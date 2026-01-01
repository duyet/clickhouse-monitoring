'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { ChartDataPoint } from '@/types/chart-data'
import type { AreaChartFactoryConfig } from './types'

import { type FC, memo, useMemo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { AreaChart } from '@/components/charts/primitives/area'
import { useChartData, useHostId } from '@/lib/swr'
import { cn, createDateTickFormatter } from '@/lib/utils'

/**
 * Factory function to create an AreaChart component with consistent patterns
 *
 * Eliminates ~45 lines of duplicate code per chart component.
 *
 * @example
 * ```typescript
 * export const ChartCpuUsage = createAreaChart<{
 *   event_time: string
 *   cpu_usage: number
 * }>({
 *   chartName: 'cpu-usage',
 *   index: 'event_time',
 *   categories: ['cpu_usage'],
 * })
 * ```
 */
export function createAreaChart<T extends ChartDataPoint = ChartDataPoint>(
  config: AreaChartFactoryConfig
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

    // Create smart date formatter based on time range
    // Only apply if no custom tickFormatter is provided
    const tickFormatter = useMemo(() => {
      if (config.areaChartProps?.tickFormatter) {
        return config.areaChartProps.tickFormatter
      }
      return lastHours ? createDateTickFormatter(lastHours) : undefined
    }, [lastHours, config.areaChartProps?.tickFormatter])

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
            <AreaChart
              className={cn(
                'h-full w-full',
                chartClassName,
                config.defaultChartClassName
              )}
              data={dataArray}
              index={config.index}
              categories={config.categories}
              {...config.areaChartProps}
              tickFormatter={tickFormatter}
              {...props}
            />
          </ChartCard>
        )}
      </ChartContainer>
    )
  })
}
