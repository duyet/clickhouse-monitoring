'use client'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RadialChartProps } from '@/types/charts'
import { LabelList, RadialBar, RadialBarChart } from 'recharts'

export function RadialChart({
  data,
  nameKey,
  dataKey,
  showLegend = false,
  showLabel = false,
  colors,
  colorLabel,
  onClick,
  className,
}: RadialChartProps) {
  const chartConfig = data
    .map((row) => row[nameKey])
    .reduce(
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

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('mx-auto aspect-square max-h-[250px]', className)}
    >
      <RadialBarChart
        accessibilityLayer
        data={data}
        innerRadius={30}
        outerRadius={110}
        barSize={25}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey={nameKey} />}
        />

        <RadialBar dataKey={dataKey} onClick={onClick} background>
          {showLabel && (
            <LabelList
              position="insideStart"
              dataKey={dataKey}
              className="fill-white capitalize mix-blend-luminosity"
              fontSize={11}
            />
          )}
        </RadialBar>

        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </RadialBarChart>
    </ChartContainer>
  )
}
