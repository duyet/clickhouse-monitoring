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
import { type AreaChartProps } from '@/types/charts'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartAreaChart,
  XAxis,
} from 'recharts'

export function AreaChart({
  data,
  index,
  categories,
  showLegend = false,
  stack = false,
  opacity = 0.6,
  colors,
  colorLabel,
  tickFormatter,
  className,
}: AreaChartProps) {
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

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
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
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={index}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={tickFormatter}
          domain={['auto', 'auto']}
          interval={'equidistantPreserveStart'}
        />

        <ChartTooltip cursor content={<ChartTooltipContent />} />

        {categories.map((category, index) => (
          <Area
            key={category + index}
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
}
