import type { Row, Table } from '@tanstack/react-table'
import { memo } from 'react'
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
  // Disable if row count <= 1
  if (table.getCoreRowModel()?.rows?.length <= 1) return value

  // Looking at pct_{columnName} for the value
  const colName = columnName.replace('readable_', '')
  const pctColName = `pct_${colName}`
  const pct = row.original[pctColName]
  const orgValue = row.original[colName]

  if (pct === undefined) {
    // Column pct_{columnName} is not defined in the query
    return value
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded p-1"
      title={`${orgValue} (${pct}%)`}
      aria-label={`${orgValue} (${pct}%)`}
      aria-roledescription="background-bar"
    >
      {/* Background bar using CSS variable for dark mode support */}
      <div
        className="absolute inset-0 bg-primary/10 transition-all"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
      <span className="relative">
        {options?.numberFormat
          ? formatReadableQuantity(value as number, 'long')
          : value}
      </span>
    </div>
  )
})
