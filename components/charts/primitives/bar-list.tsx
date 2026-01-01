'use client'

import { memo, useMemo } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export interface BarListProps {
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  formatedColumn?: string
  className?: string
}

export const BarList = memo(function BarList({
  data,
  formatedColumn,
  className,
}: BarListProps) {
  const chartConfig = useMemo(
    () =>
      ({
        value: {
          label: 'Value',
          color: 'hsl(var(--chart-1))',
        },
      }) satisfies ChartConfig,
    []
  )

  const valueFormatter = useMemo(() => {
    if (!formatedColumn) {
      return (value: number) => value.toLocaleString()
    }

    return (value: number) => {
      const formatted = data.find((d) => d.value === value)?.[
        formatedColumn
      ] as string
      return formatted || value.toLocaleString()
    }
  }, [formatedColumn, data])

  // Sort data by value in descending order
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value)
  }, [data])

  // Generate colors for bars with gradient effect
  const colors = useMemo(() => {
    const _baseColor = 'hsl(var(--chart-1))'
    return sortedData.map((_, index) => {
      const opacity = 1 - (index / sortedData.length) * 0.4
      return `hsl(var(--chart-1) / ${opacity})`
    })
  }, [sortedData])

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('min-h-[200px] w-full', className)}
    >
      <RechartBarChart
        accessibilityLayer
        data={sortedData}
        layout="vertical"
        margin={{
          left: 0,
          right: 60,
          top: 5,
          bottom: 5,
        }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          wrapperStyle={{ zIndex: 1000 }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-mono font-medium">
                    {valueFormatter(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
          {sortedData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Bar>
        <Bar
          dataKey="value"
          radius={0}
          fill="transparent"
          isAnimationActive={false}
          label={{
            position: 'right',
            fill: 'hsl(var(--foreground))',
            fontSize: 12,
            formatter: valueFormatter,
          }}
        />
      </RechartBarChart>
    </ChartContainer>
  )
})
