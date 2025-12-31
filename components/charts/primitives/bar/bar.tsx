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
import { CartesianGrid, BarChart as RechartBarChart } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import type { BarChartProps } from '@/types/charts'
import { BarAxes } from '../bar-axes'
import { BarTooltip } from '../bar-tooltip'
import { BarItem } from './components/bar-item'
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
      className={cn('h-full w-full', className)}
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

        <BarAxes
          horizontal={horizontal}
          index={index}
          categories={categories}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          tickFormatter={tickFormatter}
          yAxisTickFormatter={yAxisTickFormatter}
          xAxisLabel={xAxisLabel}
          yAxisLabel={yAxisLabel}
        />

        <BarTooltip
          tooltipTotal={tooltipTotal}
          chartConfig={chartConfig}
          categories={categories}
          xAxisDataKey={index}
        />

        {categories.map((category, index) => (
          <BarItem
            key={category}
            dataKey={category}
            data={data}
            categories={categories}
            fill={`var(--color-${category})}`}
            radius={getBarRadius({ index, categories, stack, horizontal })}
            getRadius={getBarRadius}
            index={index}
            onClickHref={onClickHref}
            labelPosition={labelPosition}
            labelAngle={labelAngle}
            showLabel={showLabel}
            stack={stack}
            readableColumn={readableColumn}
            horizontal={horizontal}
          />
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
})
