/**
 * Center label component for DonutChart
 *
 * Extracted from donut.tsx for better separation of concerns.
 */

'use client'

import type { ViewBox } from 'recharts'

export interface DonutChartLabelProps {
  viewBox?: ViewBox
  total: number
  centerLabel?: string
  formatValue: (value: number) => string
}

/**
 * Center label for donut charts
 *
 * Displays the total value and optional custom label in the center of the donut.
 */
export function DonutChartLabel({
  viewBox,
  total,
  centerLabel,
  formatValue,
}: DonutChartLabelProps) {
  if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
    return null
  }

  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
        {centerLabel || formatValue(total)}
      </tspan>
      <tspan
        x={viewBox.cx}
        y={(viewBox.cy || 0) + 24}
        className="fill-muted-foreground"
      >
        {centerLabel ? formatValue(total) : 'Total'}
      </tspan>
    </text>
  )
}
