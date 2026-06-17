'use client'

import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export interface ScatterChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  readable?: 'bytes' | 'duration' | 'number' | 'quantity'
  className?: string
}

const chartConfig = {
  scatter: {
    label: 'Data',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export const ScatterChartPrimitive = function ScatterChartPrimitive({
  data,
  xKey,
  yKeys,
  className,
}: ScatterChartProps) {
  const yKey = yKeys[0] ?? ''

  // Recharts Scatter expects numeric values; coerce strings to numbers
  const chartData = data.map((row) => ({
    ...row,
    [xKey]: Number(row[xKey]) || 0,
    [yKey]: Number(row[yKey]) || 0,
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('h-48 w-full', className)}
    >
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xKey}
          type="number"
          name={xKey}
          tick={{ fontSize: 11 }}
          label={{
            value: xKey,
            position: 'insideBottom',
            offset: -4,
            style: { fontSize: 11 },
          }}
        />
        <YAxis
          dataKey={yKey}
          type="number"
          name={yKey}
          tick={{ fontSize: 11 }}
          label={{
            value: yKey,
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            style: { fontSize: 11 },
          }}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelKey={xKey}
              nameKey={yKey}
            />
          }
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter
          data={chartData}
          fill="var(--chart-1)"
          fillOpacity={0.7}
        />
      </ScatterChart>
    </ChartContainer>
  )
}
