import type { Row, Table } from '@tanstack/react-table'

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

export const BackgroundBarFormat = function BackgroundBarFormat({
  table,
  row,
  columnName,
  value,
  options,
}: BackgroundBarFormatProps): React.ReactNode {
  // Disable if row count <= 1
  if (table.getCoreRowModel()?.rows?.length <= 1) return value

  // Looking at pct_{columnName} for the value
  const colName = columnName.replace('readable_', '')
  const pctColName = `pct_${colName}`
  const pct = row.original[pctColName]
  const orgValue = row.original[colName]

  if (pct === undefined || pct === null || !Number.isFinite(Number(pct))) {
    // Column pct_{columnName} is not defined in the query
    return value
  }

  // Get color from bank based on column name (deterministic)
  const baseColor = getColorFromBank(columnName)

  // Calculate shade based on percentage (larger = darker)
  const shade = getShade(pct as number)

  // Build inline style with dynamic color
  const barStyle = getBarStyle(baseColor, shade)

  return (
    <div
      className="relative flex items-center w-full h-full overflow-hidden rounded-sm"
      title={`${orgValue} (${pct}%)`}
      aria-label={`${orgValue} (${pct}%)`}
      aria-roledescription="background-bar"
    >
      {/* Background bar - uses inline styles for dynamic color */}
      <div
        className="absolute inset-y-0 left-0 rounded-sm transition-[width]"
        style={{ width: `${pct}%`, ...barStyle }}
        aria-hidden="true"
      />
      <span className="relative inline-block min-w-0 truncate">
        {options?.numberFormat
          ? formatReadableQuantity(value as number, 'long')
          : value}
      </span>
    </div>
  )
}
