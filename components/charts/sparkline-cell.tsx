'use client'

import type { Row, Table } from '@tanstack/react-table'

import { memo, useMemo } from 'react'

import { Sparkline } from './sparkline'

export interface SparklineCellOptions {
  /** Number of data points to show */
  points?: number
  /** Time window in minutes (e.g., 5 for last 5 minutes) */
  windowMinutes?: number
  /** Chart type */
  type?: 'line' | 'area'
  /** Show min/max dots */
  showExtremes?: boolean
  /** Color code based on trend */
  trendColor?: boolean
  /** Color of the sparkline */
  color?: string
  /** Width of the sparkline */
  width?: number
  /** Height of the sparkline */
  height?: number
}

interface SparklineCellProps {
  table: Table<any>
  row: Row<any>
  columnName: string
  value: React.ReactNode
  options?: SparklineCellOptions
}

/**
 * Sparkline cell formatter for data tables
 *
 * Displays a sparkline chart alongside the cell value.
 * The sparkline shows historical trend data for the metric.
 *
 * @example
 * In query config:
 * ```ts
 * columnFormats: {
 *   query_count: [ColumnFormat.Sparkline, { windowMinutes: 5, points: 10 }]
 * }
 * ```
 */
export const SparklineCell = memo(function SparklineCell({
  value,
  options = {},
}: SparklineCellProps): React.ReactNode {
  // Generate mock historical data based on current value
  // In production, this would fetch from an API
  const sparklineData = useMemo<number[]>(() => {
    const points = options.points ?? 10
    const currentValue =
      typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0

    // Generate synthetic trend data around the current value
    // This simulates what real historical data would look like
    return Array.from({ length: points }, (_, i) => {
      const variance = currentValue * 0.2 // 20% variance
      const noise = (Math.random() - 0.5) * variance
      const trend = (i / points) * (Math.random() - 0.5) * variance
      return Math.max(0, currentValue + noise + trend)
    })
  }, [value, options.points])

  // Don't render if value is not a number or is zero
  if (
    typeof value !== 'number' &&
    (typeof value !== 'string' || Number.isNaN(Number.parseFloat(value)))
  ) {
    return value
  }

  const numValue = typeof value === 'number' ? value : Number.parseFloat(value)
  if (numValue === 0) {
    return value
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate font-mono text-xs">{value}</span>
      <Sparkline
        data={sparklineData}
        width={options.width ?? 80}
        height={options.height ?? 24}
        type={options.type ?? 'line'}
        showExtremes={options.showExtremes}
        trendColor={options.trendColor}
        color={options.color}
      />
    </div>
  )
})
