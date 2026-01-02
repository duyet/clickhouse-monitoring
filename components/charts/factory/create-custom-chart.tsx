'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { CustomChartFactoryConfig } from './types'

import { type FC, memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { useChartData, useHostId } from '@/lib/swr'

/**
 * Factory function to create a custom chart component with consistent patterns
 *
 * For charts that need custom rendering beyond AreaChart or BarChart.
 *
 * @example
 * ```typescript
 * export const ChartBackupSize = createCustomChart<{
 *   total_size: number
 *   readable_total_size: string
 * }>({
 *   chartName: 'backup-size',
 *   render: (data, sql) => <CardMetric {...data[0]} />,
 * })
 * ```
 */
export function createCustomChart(
  config: CustomChartFactoryConfig
): FC<ChartProps> {
  return memo(function Chart({
    title = config.defaultTitle,
    interval = config.defaultInterval,
    lastHours = config.defaultLastHours,
    className,
  }: ChartProps) {
    const hostId = useHostId()
    const swr = useChartData({
      chartName: config.chartName,
      hostId,
      interval,
      lastHours,
      refreshInterval: config.refreshInterval ?? 30000,
    })

    return (
      <ChartContainer swr={swr} title={title} className={className}>
        {(dataArray, sql, metadata) => (
          <ChartCard
            title={title}
            className={className}
            contentClassName={config.contentClassName}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            data-testid={config.dataTestId}
          >
            {config.render(dataArray, sql, hostId)}
          </ChartCard>
        )}
      </ChartContainer>
    )
  })
}
