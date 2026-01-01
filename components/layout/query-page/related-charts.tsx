/**
 * RelatedCharts Component
 *
 * Renders a responsive grid of charts based on queryConfig.relatedCharts.
 *
 * Layout behavior:
 * - 1-4 charts (single row): Standard responsive grid, no row controls
 * - 5+ charts (multiple rows): Grouped into rows of 4 with inline chevron toggles
 *
 * Responsive layout per row:
 * - Mobile: 1 column (stacked)
 * - MacBook (md): 2 columns
 * - Large screen (xl): 4 columns
 *
 * Equal card heights achieved with h-full on grid items.
 */

'use client'

import { memo } from 'react'

import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'
import { ChartRow } from './chart-row'
import { groupChartsIntoRows } from './utils'

export interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  hostId: number
  gridClass?: string
  /** Row indices that are collapsed (only used for multi-row layout) */
  collapsedRows?: Set<number>
  /** Callback to toggle a specific row (only used for multi-row layout) */
  onToggleRow?: (rowIndex: number) => void
}

export const RelatedCharts = memo(function RelatedCharts({
  relatedCharts,
  hostId,
  gridClass,
  collapsedRows,
  onToggleRow,
}: RelatedChartsProps) {
  if (!relatedCharts || relatedCharts.length === 0) {
    return null
  }

  // Filter out 'break' directives and null values
  const validCharts = relatedCharts.filter((c) => c && c !== 'break')

  // Always group into rows with toggle controls
  const rows = groupChartsIntoRows(validCharts)

  return (
    <div className={cn('flex flex-col gap-4 pb-4', gridClass)}>
      {rows.map((rowCharts, rowIndex) => (
        <ChartRow
          key={`row-${rowIndex}`}
          rowIndex={rowIndex}
          charts={rowCharts}
          hostId={hostId}
          isCollapsed={collapsedRows?.has(rowIndex) ?? false}
          onToggle={() => onToggleRow?.(rowIndex)}
        />
      ))}
    </div>
  )
})
