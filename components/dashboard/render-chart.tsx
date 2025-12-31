'use client'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartError } from '@/components/charts/chart-error'
import { GithubHeatmapChart } from '@/components/charts/github-heatmap-chart'
import { AreaChart } from '@/components/charts/primitives/area'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartSkeleton } from '@/components/skeletons'
import {
  DEFAULT_CHART_COLORS,
  type ChartColor,
} from '@/components/dashboard/chart-colors'
import { useFetchData } from '@/lib/swr'

/**
 * Chart parameter types for query execution
 * Matches the types expected by useFetchData hook
 */
export interface ChartParams {
  lastHours?: number
  startDate?: string
  endDate?: string
  interval?: number
  database?: string
  table?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Supported chart kinds for RenderChart component
 */
export type ChartKind = 'area' | 'bar' | 'calendar'

/**
 * Props for RenderChart component
 */
export interface RenderChartProps {
  /**
   * Type of chart to render
   */
  kind: ChartKind

  /**
   * Chart title displayed in the card header
   */
  title: string

  /**
   * SQL query to fetch chart data
   */
  query: string

  /**
   * Query parameters for the SQL query
   */
  params: ChartParams

  /**
   * Custom color palette (CSS variable names)
   * Defaults to standard chart colors if not provided
   */
  colors?: ChartColor[]

  /**
   * Additional CSS class name for the chart card wrapper
   */
  className?: string

  /**
   * Additional CSS class name for the inner chart component
   */
  chartClassName?: string

  /**
   * ClickHouse host ID for data fetching
   */
  hostId: number
}

/**
 * Time series data point with required event_time field
 */
interface TimeSeriesDataPoint {
  event_time: string
  [key: string]: string | number | undefined
}

/**
 * RenderChart - Universal chart rendering component
 *
 * Fetches data using SWR and renders the appropriate chart type based on the `kind` prop.
 * Supports area, bar, and calendar (heatmap) chart types.
 *
 * @example
 * ```tsx
 * <RenderChart
 *   kind="area"
 *   title="Query Duration"
 *   query="SELECT event_time, avg(duration) as value FROM system.query_log GROUP BY event_time"
 *   params={{ lastHours: 24 }}
 *   hostId={0}
 * />
 * ```
 */
export const RenderChart = ({
  kind,
  title,
  query,
  params,
  colors = [...DEFAULT_CHART_COLORS] as ChartColor[],
  className,
  chartClassName,
  hostId,
}: RenderChartProps) => {
  const { data, isLoading, error, refresh } = useFetchData<TimeSeriesDataPoint[]>(
    query,
    params,
    hostId,
    30000 // refresh every 30 seconds
  )

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} onRetry={refresh} />
  }

  // event_time is a must for time series charts
  if (!data || !data[0]?.event_time) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <code>event_time</code> column is required from query result
      </div>
    )
  }

  // Categories: all columns except event_time
  const categories = Object.keys(data[0]).filter((c) => c !== 'event_time')

  if (kind === 'area') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <AreaChart
          className={chartClassName}
          data={data}
          index="event_time"
          categories={categories}
          stack
          colors={colors}
          showCartesianGrid={true}
          showYAxis={true}
          showXAxis={true}
        />
      </ChartCard>
    )
  }

  if (kind === 'bar') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <BarChart
          className={chartClassName}
          data={data}
          index="event_time"
          categories={categories}
          stack
          colors={colors}
          showYAxis={true}
          showXAxis={true}
        />
      </ChartCard>
    )
  }

  if (kind === 'calendar') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <GithubHeatmapChart
          className={chartClassName}
          data={data}
          index="event_time"
          colors={colors}
        />
      </ChartCard>
    )
  }

  return (
    <div className="flex items-center justify-center p-4 text-destructive">
      Unknown chart kind: {kind}
    </div>
  )
}
