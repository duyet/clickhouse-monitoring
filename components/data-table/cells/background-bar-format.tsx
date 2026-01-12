import type { Row, Table } from '@tanstack/react-table'

import React, { memo } from 'react'
import { getBarStyle, getColorFromBank, getShade } from '@/lib/color-bank'
import { formatReadableQuantity } from '@/lib/format-readable'

export interface BackgroundBarOptions {
  numberFormat?: boolean
}

interface BackgroundBarFormatProps {
  table: Table<any>
  row: Row<any>
  columnName: string
  value: React.ReactNode
  options?: BackgroundBarOptions
}

export const BackgroundBarFormat = memo(function BackgroundBarFormat({
  table,
  row,
  columnName,
  value,
  options,
}: BackgroundBarFormatProps): React.ReactNode {
  // Convert value to ReactNode-compatible type (React v19 doesn't allow bigint)
  const renderableValue: React.ReactNode = React.isValidElement(value)
    ? value
    : String(value)

  // Disable if row count <= 1
  if (table.getCoreRowModel()?.rows?.length <= 1) return renderableValue

  // Looking at pct_{columnName} for the value
  const colName = columnName.replace('readable_', '')
  const pctColName = `pct_${colName}`
  const pct = row.original[pctColName]
  const orgValue = row.original[colName]

  if (pct === undefined) {
    // Column pct_{columnName} is not defined in the query
    return renderableValue
  }

  // Get color from bank based on column name (deterministic)
  const baseColor = getColorFromBank(columnName)

  // Calculate shade based on percentage (larger = darker)
  const shade = getShade(pct as number)

  // Build inline style with dynamic color
  const barStyle = getBarStyle(baseColor, shade)

  return (
    <div
      className="relative flex items-center w-full min-h-[1.75rem] h-full overflow-hidden rounded"
      title={`${orgValue} (${pct}%)`}
      aria-label={`${orgValue} (${pct}%)`}
      aria-roledescription="background-bar"
    >
      {/* Background bar - uses inline styles for dynamic color */}
      <div
        className="absolute inset-y-0 left-0 rounded transition-all"
        style={{ width: `${pct}%`, ...barStyle }}
        aria-hidden="true"
      />
      <span className="relative inline-block min-w-0 truncate px-2">
        {options?.numberFormat
          ? formatReadableQuantity(
              typeof renderableValue === 'number'
                ? renderableValue
                : Number(renderableValue),
              'long'
            )
          : renderableValue}
      </span>
    </div>
  )
})
