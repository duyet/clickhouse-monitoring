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

'use client'

import { DEFAULT_CHART_COLORS, type ChartColor } from './chart-colors'
import type { RenderChartProps } from './render-chart/types'
import { useChartData } from './render-chart/use-chart-data'
import { CHART_RENDERERS } from './render-chart/chart-renderers'
import {
  ChartLoadingState,
  ChartErrorState,
  ChartMissingEventTime,
  UnknownChartKind,
} from './render-chart/loading-states'

export * from './render-chart/types'

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
  const { data, isLoading, error, categories, isValid, refresh } = useChartData(
    { query, params, hostId }
  )

  if (isLoading) {
    return <ChartLoadingState title={title} className={className} />
  }

  if (error) {
    return <ChartErrorState error={error} title={title} onRetry={refresh} />
  }

  if (!isValid) {
    return <ChartMissingEventTime title={title} />
  }

  const Renderer = CHART_RENDERERS[kind]

  if (!Renderer) {
    return <UnknownChartKind kind={kind} />
  }

  return (
    <Renderer
      title={title}
      data={data!}
      categories={categories}
      colors={colors}
      className={className}
      chartClassName={chartClassName}
      query={query}
    />
  )
}
