'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { DateRangeValue } from '@/components/date-range'

import { memo, useState } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarChart } from '@/components/charts/primitives/bar/bar'
import { DATE_RANGE_PRESETS } from '@/components/date-range'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export const ChartSlowQueryOccurrences = memo(
  function ChartSlowQueryOccurrences({
    title = 'Slow Query Occurrences (>= 5s)',
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
    className,
    chartClassName,
    hostId,
    ...props
  }: ChartProps) {
    const [rangeOverride, setRangeOverride] = useState<DateRangeValue | null>(
      null
    )

    const effectiveLastHours = rangeOverride?.lastHours ?? lastHours
    const effectiveInterval = rangeOverride?.interval ?? interval

    const swr = useChartData<{
      event_time: string
      count: number
    }>({
      chartName: 'slow-query-occurrences',
      hostId,
      interval: effectiveInterval,
      lastHours: effectiveLastHours,
      refreshInterval: 30000,
    })

    return (
      <ChartContainer
        swr={swr}
        title={title}
        className={className}
        chartClassName={chartClassName}
      >
        {(dataArray, sql, metadata, staleError, mutate) => (
          <ChartCard
            title={title}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            dateRangeConfig={DATE_RANGE_PRESETS.historical}
            currentRange={rangeOverride?.value}
            onRangeChange={setRangeOverride}
            staleError={staleError}
            onRetry={mutate}
            data-testid="slow-query-occurrences-chart"
          >
            <BarChart
              className={chartClassName}
              data={dataArray}
              index="event_time"
              categories={['count']}
              colors={['--chart-1']}
              yAxisTickFormatter={chartTickFormatters.count}
              {...props}
            />
          </ChartCard>
        )}
      </ChartContainer>
    )
  }
)

export default ChartSlowQueryOccurrences
