'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { ChartDataPoint } from '@/types/chart-data'

import { useMemo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { AreaChart } from '@/components/charts/primitives/area'
import { pivotRows, type RawRow } from '@/lib/chart-utils'
import { useChartData, useHostId } from '@/lib/swr'
import { createDateTickFormatter } from '@/lib/utils'

const CHART_NAME = 'keeper-requests'
const DEFAULT_TITLE = 'Keeper/ZooKeeper Request Metrics'
const DEFAULT_INTERVAL = 'toStartOfFifteenMinutes'
const DEFAULT_LAST_HOURS = 24

export function ChartKeeperRequests({
  title = DEFAULT_TITLE,
  interval = DEFAULT_INTERVAL,
  lastHours = DEFAULT_LAST_HOURS,
  className,
  chartClassName,
}: ChartProps) {
  const hostId = useHostId()
  const swr = useChartData<RawRow>({
    chartName: CHART_NAME,
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  const { pivoted, categories } = useMemo(() => {
    if (!swr.data || swr.data.length === 0) {
      return { pivoted: [], categories: [] }
    }
    return pivotRows(swr.data)
  }, [swr.data])

  const tickFormatter = useMemo(
    () => createDateTickFormatter(lastHours),
    [lastHours]
  )

  if (!swr.isLoading && !swr.error && pivoted.length === 0) {
    return (
      <ChartEmpty
        title={title}
        className={className}
        description="No Keeper/ZooKeeper request data recorded in this time period"
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
      {(_, sql, metadata, staleError, mutate) => (
        <ChartCard
          title={title}
          sql={sql}
          data={pivoted as ChartDataPoint[]}
          metadata={metadata}
          data-testid="keeper-requests-chart"
          staleError={staleError}
          onRetry={mutate}
        >
          <AreaChart
            className="h-full w-full"
            data={pivoted as ChartDataPoint[]}
            index="event_time"
            categories={categories}
            showLegend={categories.length > 1}
            tickFormatter={tickFormatter}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
}

export type ChartKeeperRequestsProps = ChartProps

export default ChartKeeperRequests
