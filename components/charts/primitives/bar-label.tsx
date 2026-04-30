'use client'

import { LabelList } from 'recharts'

import type { BarChartProps } from '@/types/charts'

import { memo } from 'react'

interface BarLabelProps
  extends Pick<
    BarChartProps,
    | 'showLabel'
    | 'labelPosition'
    | 'labelAngle'
    | 'data'
    | 'stack'
    | 'categories'
    | 'readableColumn'
    | 'horizontal'
  > {
  dataKey?: string | number
}

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

  const labelFormatter = (value: unknown) => {
    const valueString = String(value ?? '')

    if (!readableColumn) {
      return valueString
    }

    for (const category of categories) {
      const formatted = data.find((row) => row[category] === value)?.[
        readableColumn
      ]

      if (formatted !== undefined && formatted !== null) {
        return String(formatted)
      }
    }

    return valueString
  }

  const position =
    labelPosition ||
    (stack
      ? horizontal
        ? 'insideLeft'
        : 'inside'
      : horizontal
        ? 'right'
        : 'top')

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
