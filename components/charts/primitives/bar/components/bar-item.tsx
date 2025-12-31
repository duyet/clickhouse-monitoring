/**
 * Single bar component with label and click handling
 */

'use client'

import { Bar } from 'recharts'
import { binding } from '@/lib/utils'
import { BarLabel } from '../../bar-label'
import type { BarChartProps } from '@/types/charts'

interface BarItemProps extends Pick<BarChartProps, 'labelPosition' | 'labelAngle' | 'showLabel' | 'stack' | 'readableColumn' | 'horizontal'> {
  dataKey: string
  data: Record<string, unknown>[]
  categories: string[]
  fill: string
  radius: number | [number, number, number, number]
  onClickHref?: string
  getRadius: (options: { index: number; categories: string[]; stack: boolean; horizontal: boolean }) => number | [number, number, number, number]
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
  getRadius,
  index,
  labelPosition,
  labelAngle,
  showLabel,
  stack,
  readableColumn,
  horizontal,
}: BarItemProps) {
  return (
    <Bar
      key={dataKey}
      dataKey={dataKey}
      layout={horizontal ? 'vertical' : 'horizontal'}
      fill={fill}
      stackId={stack ? 'a' : undefined}
      radius={radius}
      maxBarSize={120}
      minPointSize={3}
      onClick={(data) => {
        if (onClickHref) {
          window.location.href = binding(onClickHref, data)
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
