/**
 * Chart renderer components for each chart kind
 */

import { AreaChart } from '@/components/charts/primitives/area'
import { BarChart } from '@/components/charts/primitives/bar'
import { GithubHeatmapChart } from '@/components/charts/github-heatmap-chart'
import { ChartCard } from '@/components/cards/chart-card'
import type { ChartColor } from '../chart-colors'
import type { ChartKind, TimeSeriesDataPoint } from './types'

interface ChartRendererProps {
  kind: ChartKind
  title: string
  data: TimeSeriesDataPoint[]
  categories: string[]
  colors: ChartColor[]
  className?: string
  chartClassName?: string
  query: string
}

/**
 * Area chart renderer with stacked series
 */
export function AreaChartRenderer({
  title,
  data,
  categories,
  colors,
  className,
  chartClassName,
  query,
}: Omit<ChartRendererProps, 'kind'>) {
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

/**
 * Bar chart renderer with stacked series
 */
export function BarChartRenderer({
  title,
  data,
  categories,
  colors,
  className,
  chartClassName,
  query,
}: Omit<ChartRendererProps, 'kind'>) {
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

/**
 * Calendar/heatmap chart renderer
 */
export function CalendarChartRenderer({
  title,
  data,
  colors,
  className,
  chartClassName,
  query,
}: Omit<ChartRendererProps, 'kind' | 'categories'>) {
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

/**
 * Chart kind to renderer mapping
 */
export const CHART_RENDERERS: Record<ChartKind, typeof AreaChartRenderer> = {
  area: AreaChartRenderer,
  bar: BarChartRenderer,
  calendar: CalendarChartRenderer,
} as const
