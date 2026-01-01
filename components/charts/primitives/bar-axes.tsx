'use client'

import { memo } from 'react'
import { XAxis, YAxis } from 'recharts'
import type { BarChartProps } from '@/types/charts'

interface BarAxesProps {
  horizontal: boolean
  index?: string
  categories: string[]
  showXAxis: boolean
  showYAxis: boolean
  tickFormatter?: BarChartProps['tickFormatter']
  yAxisTickFormatter?: BarChartProps['tickFormatter']
  xAxisLabel?: string
  yAxisLabel?: string
}

/**
 * BarAxes - Axis rendering component for BarChart
 *
 * Handles X and Y axis rendering for both horizontal and vertical bar charts.
 * Supports axis labels, tick formatting, and conditional visibility.
 */
export const BarAxes = memo(function BarAxes({
  horizontal,
  index,
  categories,
  showXAxis,
  showYAxis,
  tickFormatter,
  yAxisTickFormatter,
  xAxisLabel,
  yAxisLabel,
}: BarAxesProps) {
  // Horizontal bars: Y is categorical, X is numeric (hidden)
  if (horizontal) {
    return (
      <>
        {showXAxis && (
          <XAxis
            dataKey={categories[0]}
            type="number"
            hide
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -10,
                  }
                : undefined
            }
          />
        )}
        {showYAxis && (
          <YAxis
            dataKey={index}
            type="category"
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter || yAxisTickFormatter}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />
        )}
      </>
    )
  }

  // Vertical bars: X is categorical, Y is numeric
  return (
    <>
      {showXAxis && (
        <XAxis
          dataKey={index}
          tickLine={false}
          tickMargin={10}
          axisLine={true}
          tickFormatter={tickFormatter}
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -10,
                }
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
          domain={[0, 'auto']}
          allowDataOverflow={false}
          label={
            yAxisLabel
              ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
              : undefined
          }
        />
      )}
    </>
  )
})
