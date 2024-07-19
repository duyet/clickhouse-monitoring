'use client'

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
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
  showLegend = true,
  stack = false,
  tickFormatter,
}: BarChartProps) {
  const chartConfig = categories.reduce(
    (acc, category, index) => {
      acc[category] = {
        label: category,
        color: `hsl(var(--chart-${index + 1}))`,
      }

      return acc
    },
    {
      label: {
        color: 'hsl(var(--background))',
      },
    } as ChartConfig
  )

  const labelContent = (props: any) => {
    const { x, y, width, height, value } = props

    const render = (value: string | number) => (
      <g>
        <text
          x={x + width / 2}
          y={y - 10}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {value}
        </text>
      </g>
    )

    if (!readableColumn) {
      return render(value)
    }

    for (let category of categories) {
      const formated = data.find((row) => row[category] === value)?.[
        readableColumn
      ]

      if (formated) {
        return render(formated)
      }
    }

    return render(value)
  }

  const getRadius = (
    index: number,
    length: number,
    stack: boolean
  ): number | [number, number, number, number] => {
    if (!stack) {
      return 8
    }

    if (length === 1) {
      return 8
    }

    if (index === 0) {
      return [0, 0, 8, 8]
    }

    if (index === length - 1) {
      return [8, 8, 0, 0]
    }

    return [0, 0, 0, 0]
  }

  return (
    <ChartContainer config={chartConfig}>
      <RechartBarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
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
            {/* TODO: hide or move outside if column height too small */}
            {stack ? (
              <LabelList
                position="inside"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
                content={readableColumn ? labelContent : undefined}
              />
            ) : (
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                content={readableColumn ? labelContent : undefined}
              />
            )}
          </Bar>
        ))}

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartBarChart>
    </ChartContainer>
  )
}
