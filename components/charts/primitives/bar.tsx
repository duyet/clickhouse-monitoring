'use client'

import { memo, useMemo } from 'react'
import { Bar, CartesianGrid, BarChart as RechartBarChart } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { binding, cn } from '@/lib/utils'
import type { BarChartProps } from '@/types/charts'
import { BarAxes } from './bar-axes'
import { BarLabel } from './bar-label'
import { BarTooltip } from './bar-tooltip'

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
    () =>
      categories.reduce(
        (acc, category, index) => {
          acc[category] = {
            label: category,
            color: colors
              ? `var(${colors[index]})`
              : `var(--chart-${index + 1})`,
          }

          return acc
        },
        {
          label: {
            color: colorLabel ? `var(${colorLabel})` : 'var(--background)',
          },
        } as ChartConfig
      ),
    [categories, colors, colorLabel]
  )

  const getRadius = useMemo(
    () =>
      ({
        index,
        categories,
        stack,
        horizontal,
      }: Pick<BarChartProps, 'categories' | 'horizontal' | 'stack'> & {
        index: number
      }): number | [number, number, number, number] => {
        const length = categories.length
        const radius = 6

        if (!stack) {
          return radius
        }

        if (length === 1) {
          return radius
        }

        if (index === 0) {
          if (horizontal) {
            return [radius, 0, 0, radius]
          } else {
            return [0, 0, radius, radius]
          }
        }

        if (index === length - 1) {
          if (horizontal) {
            return [0, radius, radius, 0]
          } else {
            return [radius, radius, 0, 0]
          }
        }

        return [0, 0, 0, 0]
      },
    []
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
          <Bar
            key={category}
            dataKey={category}
            layout={horizontal ? 'vertical' : 'horizontal'}
            fill={`var(--color-${category})`}
            stackId={stack ? 'a' : undefined}
            radius={getRadius({ index, categories, stack, horizontal })}
            maxBarSize={120}
            minPointSize={3}
            onClick={(data) => {
              if (onClickHref) {
                window.location.href = binding(onClickHref, data)
              }
            }}
            cursor={onClickHref !== undefined ? 'pointer' : 'default'}
          >
            <BarLabel
              dataKey={category}
              showLabel={showLabel}
              labelPosition={labelPosition}
              labelAngle={labelAngle}
              stack={stack}
              data={data}
              categories={categories}
              readableColumn={readableColumn}
              horizontal={horizontal}
            />
          </Bar>
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
})
