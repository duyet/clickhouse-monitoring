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
  YAxis,
  type LabelListProps,
} from 'recharts'
import { type ViewBox } from 'recharts/types/util/types'

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
  horizontal = false,
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

  const getRadius = ({
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
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
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

        {horizontal ? (
          <>
            <XAxis dataKey={categories[0]} type="number" hide />
            <YAxis
              dataKey={index}
              type="category"
              tickLine={false}
              axisLine={false}
              tickFormatter={tickFormatter}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={index}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={tickFormatter}
            />
          </>
        )}

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

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
          >
            {renderChartLabel({
              dataKey: category,
              showLabel,
              labelPosition,
              labelAngle,
              stack,
              data,
              categories,
              readableColumn,
              horizontal,
            })}
          </Bar>
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
}

interface Data {
  value?: number | string | Array<number | string>
  payload?: any
  parentViewBox?: ViewBox
}

function renderChartLabel<T extends Data>({
  dataKey,
  showLabel,
  labelPosition,
  labelAngle,
  data,
  stack,
  categories,
  readableColumn,
  horizontal,
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
  | 'horizontal'
> &
  Pick<LabelListProps<T>, 'dataKey'>) {
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
        dataKey={dataKey}
        position={labelPosition || (horizontal ? 'insideLeft' : 'inside')}
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
      dataKey={dataKey}
      position={labelPosition || (horizontal ? 'right' : 'top')}
      offset={8}
      className="fill-foreground"
      fontSize={12}
      formatter={readableColumn ? labelFormatter : undefined}
      angle={labelAngle}
    />
  )
}
