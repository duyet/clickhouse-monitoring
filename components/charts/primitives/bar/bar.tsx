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

import { memo, useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  BarChart as RechartBarChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import type { BarChartProps } from '@/types/charts'
import { BarTooltip } from '../bar-tooltip'
import { generateChartConfig, getBarRadius } from './utils'

export const BarChart = memo(function BarChart({
  data,
  index,
  categories,
  readableColumn,
  labelPosition,
  labelAngle,
  showLegend = false,
  showLabel = false,
  stack = false,
  horizontal = false,
  tooltipTotal = false,
  onClickHref,
  colors,
  colorLabel,
  tickFormatter,
  yAxisTickFormatter,
  showXAxis = true,
  showYAxis = true,
  xAxisLabel,
  yAxisLabel,
  className,
}: BarChartProps & {
  yAxisTickFormatter?: (value: string | number) => string
}) {
  const chartConfig = useMemo(
    () => generateChartConfig(categories, colors, colorLabel),
    [categories, colors, colorLabel]
  )

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('h-full w-full aspect-auto', className)}
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

        <BarTooltip
          tooltipTotal={tooltipTotal}
          chartConfig={chartConfig}
          categories={categories}
          xAxisDataKey={index}
        />

        {categories.map((category, idx) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--color-${category})`}
            stackId={stack ? 'a' : undefined}
            radius={getBarRadius({
              index: idx,
              categories,
              stack,
              horizontal,
            })}
            isAnimationActive={false}
          />
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
})
