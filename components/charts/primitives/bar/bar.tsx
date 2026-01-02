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

import { BarTooltip } from '../bar-tooltip'
import {
  generateChartConfig,
  getBarRadius,
  sortCategoriesByTotal,
} from './utils'
import { memo, useMemo } from 'react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
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
}: BarChartProps & {
  yAxisTickFormatter?: (value: string | number) => string
}) {
  // Sort categories by total value for stacked bars (larger on top)
  const sortedCategories = useMemo(
    () => (stack ? sortCategoriesByTotal(data, categories) : categories),
    [data, categories, stack]
  )

  const chartConfig = useMemo(
    () => generateChartConfig(categories, colors, colorLabel),
    [categories, colors, colorLabel]
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
            domain={[0, 'auto']}
          />
        )}

        {sortedCategories.map((category, idx) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--color-${category})`}
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

        <BarTooltip
          tooltipTotal={tooltipTotal}
          chartConfig={chartConfig}
          categories={sortedCategories}
          xAxisDataKey={index}
        />

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
})
