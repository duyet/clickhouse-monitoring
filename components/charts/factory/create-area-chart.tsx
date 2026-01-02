'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { DateRangeValue } from '@/components/date-range'
import type { ChartDataPoint } from '@/types/chart-data'
import type { AreaChartFactoryConfig } from './types'

import { type FC, memo, useMemo, useState } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { AreaChart } from '@/components/charts/primitives/area'
import { resolveDateRangeConfig } from '@/components/date-range'
import { useChartData, useHostId } from '@/lib/swr'
import { cn, createDateTickFormatter } from '@/lib/utils'

/**
 * Check if all values in the specified categories are zero or empty
 * This helps detect when a chart has data rows but no meaningful values to display
 */
function hasOnlyZeroValues(
  data: Record<string, unknown>[],
  categories: string[]
): boolean {
  if (!data || data.length === 0) return false

  return data.every((row) =>
    categories.every((cat) => {
      const value = row[cat]
      return value === 0 || value === null || value === undefined
    })
  )
}

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
export function createAreaChart(config: AreaChartFactoryConfig): FC<ChartProps> {
  // Resolve date range config once (stable reference)
  const resolvedDateRangeConfig = config.dateRangeConfig
    ? resolveDateRangeConfig(config.dateRangeConfig)
    : undefined

  return memo(function Chart({
    title = config.defaultTitle,
    interval = config.defaultInterval,
    lastHours = config.defaultLastHours,
    className,
    chartClassName,
    ...props
  }: ChartProps) {
    const hostId = useHostId()

    // Date range state (only used when dateRangeConfig is provided)
    const [rangeOverride, setRangeOverride] = useState<DateRangeValue | null>(
      null
    )

    // Use override values when date range is selected, otherwise use props/defaults
    const effectiveLastHours = rangeOverride?.lastHours ?? lastHours
    const effectiveInterval = rangeOverride?.interval ?? interval

    const swr = useChartData({
      chartName: config.chartName,
      hostId,
      interval: effectiveInterval,
      lastHours: effectiveLastHours,
      refreshInterval: config.refreshInterval ?? 30000,
    })

    // Create smart date formatter based on time range
    // Only apply if no custom tickFormatter is provided
    const tickFormatter = useMemo(() => {
      if (config.areaChartProps?.tickFormatter) {
        return config.areaChartProps.tickFormatter
      }
      return effectiveLastHours
        ? createDateTickFormatter(effectiveLastHours)
        : undefined
    }, [effectiveLastHours])

    // Check if data has all zero values - show empty state with message
    // biome-ignore lint/correctness/useExhaustiveDependencies: config.categories is stable from factory
    const allZeros = useMemo(() => {
      if (!swr.data || swr.data.length === 0) return false
      return hasOnlyZeroValues(swr.data, config.categories)
    }, [swr.data])

    // If data exists but all values are zero, show informative empty state
    if (allZeros && !swr.isLoading && !swr.error) {
      return (
        <ChartEmpty
          title={title}
          className={className}
          description="No values recorded in this time period"
          sql={swr.sql}
          data={swr.data}
          metadata={swr.metadata}
          onRetry={() => swr.mutate()}
        />
      )
    }

    return (
      <ChartContainer
        swr={swr}
        title={title}
        className={className}
        chartClassName={chartClassName}
      >
        {(dataArray, sql, metadata) => (
          <ChartCard
            title={title}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            data-testid={config.dataTestId}
            dateRangeConfig={resolvedDateRangeConfig}
            currentRange={rangeOverride?.value}
            onRangeChange={
              resolvedDateRangeConfig ? setRangeOverride : undefined
            }
          >
            <AreaChart
              className={cn(
                'h-full w-full',
                chartClassName,
                config.defaultChartClassName
              )}
              data={dataArray as ChartDataPoint[]}
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
