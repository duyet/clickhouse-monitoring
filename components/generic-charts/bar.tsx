'use client'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { type BarChartProps } from '@/types/charts'
import {
  Bar,
  CartesianGrid,
  LabelList,
  BarChart as RechartBarChart,
  XAxis,
} from 'recharts'

export function BarChart({
  data,
  index,
  categories,
  readableColumn,
  labelPosition,
  labelAngle,
  showLegend = true,
  showLabel = true,
  stack = false,
  colors,
  colorLabel,
  tickFormatter,
  className,
}: BarChartProps) {
  const chartConfig = categories.reduce(
    (acc, category, index) => {
      acc[category] = {
        label: category,
        color: colors
          ? `hsl(var(${colors[index]}))`
          : `hsl(var(--chart-${index + 1}))`,
      }

      return acc
    },
    {
      label: {
        color: colorLabel
          ? `hsl(var(${colorLabel}))`
          : 'hsl(var(--background))',
      },
    } as ChartConfig
  )

  const getRadius = (
    index: number,
    length: number,
    stack: boolean
  ): number | [number, number, number, number] => {
    const radius = 6

    if (!stack) {
      return radius
    }

    if (length === 1) {
      return radius
    }

    if (index === 0) {
      return [0, 0, radius, radius]
    }

    if (index === length - 1) {
      return [radius, radius, 0, 0]
    }

    return [0, 0, 0, 0]
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
    >
      <RechartBarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 5,
        }}
      >
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey={index}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={tickFormatter}
        />

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={`var(--color-${category})`}
            stackId={stack ? 'a' : undefined}
            radius={getRadius(index, categories.length, stack)}
          >
            {renderChartLabel({
              showLabel,
              labelPosition,
              labelAngle,
              stack,
              data,
              categories,
              readableColumn,
            })}
          </Bar>
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
}

function renderChartLabel({
  showLabel,
  labelPosition,
  labelAngle,
  data,
  stack,
  categories,
  readableColumn,
}: Pick<
  BarChartProps,
  | 'showLabel'
  | 'labelPosition'
  | 'labelAngle'
  | 'data'
  | 'stack'
  | 'categories'
  | 'readableColumn'
  | 'labelFormatter'
>) {
  if (!showLabel) return null

  const labelFormatter = (value: string) => {
    if (!readableColumn) {
      return value
    }

    for (let category of categories) {
      const formated = data.find((row) => row[category] === value)?.[
        readableColumn
      ]

      if (formated) {
        return formated
      }
    }

    return value
  }

  if (stack) {
    return (
      <LabelList
        position={labelPosition || 'inside'}
        offset={8}
        className="fill-[--color-label]"
        fontSize={12}
        formatter={readableColumn ? labelFormatter : undefined}
        angle={labelAngle}
      />
    )
  }

  return (
    <LabelList
      position={labelPosition || 'top'}
      offset={12}
      className="fill-foreground"
      fontSize={12}
      formatter={readableColumn ? labelFormatter : undefined}
      angle={labelAngle}
    />
  )
}
