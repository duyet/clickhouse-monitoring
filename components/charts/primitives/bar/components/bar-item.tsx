/**
 * Single bar component with label and click handling
 */

'use client'

import { Bar } from 'recharts'

import type { BarChartProps } from '@/types/charts'

import { BarLabel } from '../../bar-label'
import { replaceTemplateVariables } from '@/lib/template-utils'

interface BarItemProps
  extends Pick<
    BarChartProps,
    | 'labelPosition'
    | 'labelAngle'
    | 'showLabel'
    | 'stack'
    | 'readableColumn'
    | 'horizontal'
  > {
  dataKey: string
  data: Record<string, unknown>[]
  categories: string[]
  fill: string
  radius: number | [number, number, number, number]
  onClickHref?: string
  getRadius: (options: {
    index: number
    categories: string[]
    stack: boolean
    horizontal: boolean
  }) => number | [number, number, number, number]
  index: number
}

/**
 * Recharts Bar component with label and optional click navigation
 */
export function BarItem({
  dataKey,
  data,
  categories,
  fill,
  radius,
  onClickHref,
  getRadius: _getRadius,
  index: _index,
  labelPosition,
  labelAngle,
  showLabel,
  stack,
  readableColumn,
  horizontal,
}: BarItemProps) {
  return (
    <Bar
      dataKey={dataKey}
      fill={fill}
      stackId={stack ? 'a' : undefined}
      radius={radius}
      maxBarSize={120}
      minPointSize={3}
      onClick={(data) => {
        if (onClickHref) {
          window.location.href = replaceTemplateVariables(onClickHref, data)
        }
      }}
      cursor={onClickHref !== undefined ? 'pointer' : 'default'}
    >
      <BarLabel
        dataKey={dataKey}
        showLabel={showLabel}
        labelPosition={labelPosition}
        labelAngle={labelAngle}
        stack={stack}
        data={data}
        categories={categories}
        readableColumn={readableColumn}
        horizontal={horizontal}
      />
    </Bar>
  )
}
