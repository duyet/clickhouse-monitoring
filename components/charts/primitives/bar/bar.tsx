/**
 * Bar chart component built on Recharts
 *
 * Features:
 * - Stacked and grouped bars
 * - Horizontal and vertical layouts
 * - Custom labels and tooltips
 * - Click-to-navigate support
 * - Configurable axes and legends
 */

'use client'

import {
  Bar,
  CartesianGrid,
  BarChart as RechartBarChart,
  XAxis,
  YAxis,
} from 'recharts'

import type { BarChartProps } from '@/types/charts'

import { renderBarTooltip } from '../bar-tooltip'
import {
  generateChartConfig,
  getBarRadius,
  sanitizeCssVarName,
  sortCategoriesByTotal,
} from './utils'
import { memo, useMemo } from 'react'
import { useChartScaleValue } from '@/components/charts/chart-scale-context'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { getYAxisDomain, resolveYAxisScale } from '@/lib/chart-scale'
import { cn } from '@/lib/utils'

export const BarChart = memo(function BarChart({
  data,
  index,
  categories,
  readableColumn: _readableColumn,
  labelPosition: _labelPosition,
  labelAngle: _labelAngle,
  showLegend = false,
  showLabel: _showLabel = false,
  stack = false,
  horizontal = false,
  tooltipTotal = false,
  onClickHref: _onClickHref,
  colors,
  colorLabel,
  tickFormatter,
  yAxisTickFormatter,
  showXAxis = true,
  showYAxis = true,
  xAxisLabel: _xAxisLabel,
  yAxisLabel: _yAxisLabel,
  className,
  yAxisScale,
}: BarChartProps & {
  yAxisTickFormatter?: (value: string | number) => string
}) {
  // Sort categories by total value for stacked bars (larger on top)
  const sortedCategories = useMemo(
    () => (stack ? sortCategoriesByTotal(data, categories) : categories),
    [data, categories, stack]
  )

  // Get scale preference from context (if available)
  const contextScale = useChartScaleValue()

  // Use prop if provided, otherwise use context, otherwise 'linear'
  const effectiveScale = yAxisScale ?? contextScale ?? 'linear'

  // Resolve scale type (linear, log, or auto-detect)
  const resolvedScale = useMemo(
    () =>
      resolveYAxisScale(
        effectiveScale,
        data as Record<string, unknown>[],
        categories
      ),
    [effectiveScale, data, categories]
  )

  // Get appropriate domain for the scale type
  const yAxisDomain = useMemo(
    () =>
      getYAxisDomain(
        data as Record<string, unknown>[],
        categories,
        resolvedScale === 'log'
      ),
    [data, categories, resolvedScale]
  )

  const chartConfig = useMemo(
    () => generateChartConfig(categories, colors, colorLabel),
    [categories, colors, colorLabel]
  )

  // Memoize tooltip to prevent recreation on every render
  // Must use render function (not component) for Recharts to detect it
  const tooltip = useMemo(
    () =>
      renderBarTooltip({
        tooltipTotal,
        categories: sortedCategories,
      }),
    [tooltipTotal, sortedCategories]
  )

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('!aspect-auto h-full w-full min-w-0', className)}
    >
      <RechartBarChart
        accessibilityLayer
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{
          top: 5,
        }}
      >
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} />

        {showXAxis && (
          <XAxis
            dataKey={index}
            tickLine={false}
            tickMargin={10}
            axisLine={true}
            tickFormatter={tickFormatter}
          />
        )}

        {showYAxis && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={yAxisTickFormatter}
            scale={resolvedScale}
            domain={yAxisDomain}
            allowDataOverflow={resolvedScale === 'log'}
          />
        )}

        {sortedCategories.map((category, idx) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--color-${sanitizeCssVarName(category)})`}
            stackId={stack ? 'a' : undefined}
            radius={getBarRadius({
              index: idx,
              categories: sortedCategories,
              stack,
              horizontal,
            })}
            isAnimationActive={false}
          />
        ))}

        {tooltip}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
})
