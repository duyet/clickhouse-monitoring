'use client'

import { LabelList, type LabelListProps } from 'recharts'
import { memo } from 'react'
import type { BarChartProps } from '@/types/charts'

interface Data {
  value?: number | string | Array<number | string>
  payload?: any
  parentViewBox?: any
}

interface BarLabelProps extends Pick<BarChartProps,
  | 'showLabel'
  | 'labelPosition'
  | 'labelAngle'
  | 'data'
  | 'stack'
  | 'categories'
  | 'readableColumn'
  | 'horizontal'
>,
  Pick<LabelListProps<Data>, 'dataKey'>
{}

/**
 * BarLabel - Label rendering component for BarChart
 *
 * Handles label positioning and formatting for bar chart labels.
 * Supports stacked bars with different positioning strategies.
 */
export const BarLabel = memo(function BarLabel({
  dataKey,
  showLabel,
  labelPosition,
  labelAngle,
  data,
  stack,
  categories,
  readableColumn,
  horizontal,
}: BarLabelProps) {
  if (!showLabel) return null

  const labelFormatter = (value: string) => {
    if (!readableColumn) {
      return value
    }

    for (const category of categories) {
      const formatted = data.find((row) => row[category] === value)?.[
        readableColumn
      ]

      if (formatted) {
        return formatted
      }
    }

    return value
  }

  const position = labelPosition || (stack
    ? (horizontal ? 'insideLeft' : 'inside')
    : (horizontal ? 'right' : 'top')
  )

  const className = stack ? 'fill-(--color-label)' : 'fill-foreground'

  return (
    <LabelList
      dataKey={dataKey}
      position={position}
      offset={8}
      className={className}
      fontSize={12}
      formatter={readableColumn ? labelFormatter : undefined}
      angle={labelAngle}
    />
  )
})
