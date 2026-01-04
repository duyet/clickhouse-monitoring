'use client'

import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  XAxis,
  YAxis,
} from 'recharts'

import type { AreaChartProps } from '@/types/charts'

import { renderChartTooltip } from './area-chart-tooltip'
import { memo, useMemo } from 'react'
import { useChartScaleValue } from '@/components/charts/chart-scale-context'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { getYAxisDomain, resolveYAxisScale } from '@/lib/chart-scale'
import { cn } from '@/lib/utils'

export const AreaChart = memo(function AreaChart({
  data,
  index,
  categories,
  showLegend = false,
  showXAxis = true,
  showYAxis = true,
  showCartesianGrid = true,
  stack = false,
  opacity = 0.6,
  colors,
  colorLabel,
  tickFormatter,
  yAxisTickFormatter,
  xAxisLabel,
  yAxisLabel,
  breakdown,
  breakdownLabel,
  breakdownValue,
  breakdownHeading,
  tooltipActive,
  chartConfig: customChartConfig,
  className,
  yAxisScale,
}: AreaChartProps & {
  yAxisTickFormatter?: (value: string | number) => string
}) {
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
  const chartConfig = useMemo(() => {
    const config = categories.reduce(
      (acc, category, index) => {
        acc[category] = {
          label: category,
          color: colors ? `var(${colors[index]})` : `var(--chart-${index + 1})`,
        }

        return acc
      },
      {
        label: {
          color: colorLabel ? `var(${colorLabel})` : 'var(--background)',
        },
      } as ChartConfig
    )

    return {
      ...config,
      ...(customChartConfig || {}),
    }
  }, [categories, colors, colorLabel, customChartConfig])

  // Memoize tooltip renderer to prevent recreation on every render
  const tooltip = useMemo(
    () =>
      renderChartTooltip({
        breakdown,
        breakdownLabel,
        breakdownValue,
        breakdownHeading,
        tooltipActive,
        chartConfig,
        categories,
      }),
    [
      breakdown,
      breakdownLabel,
      breakdownValue,
      breakdownHeading,
      tooltipActive,
      chartConfig,
      categories,
    ]
  )

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('!aspect-auto h-full w-full min-w-0', className)}
    >
      <RechartAreaChart
        accessibilityLayer
        data={data}
        margin={{
          top: 4,
          left: 12,
          right: 12,
        }}
      >
        {showCartesianGrid && <CartesianGrid vertical={false} />}
        {showXAxis && (
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={tickFormatter}
            domain={['auto', 'auto']}
            interval={'equidistantPreserveStart'}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -10 }
                : undefined
            }
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
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
        )}

        {tooltip}

        {categories.map((category) => (
          <Area
            key={`${category}`}
            dataKey={category}
            fill={`var(--color-${category})`}
            stroke={`var(--color-${category})`}
            strokeWidth={2}
            stackId={stack ? 'a' : undefined}
            type="linear"
            fillOpacity={opacity}
          />
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartAreaChart>
    </ChartContainer>
  )
})
