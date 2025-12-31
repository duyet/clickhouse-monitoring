import type { Row, Table } from '@tanstack/react-table'
import { memo } from 'react'
import { formatReadableQuantity } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

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

  // Determine color based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500/20 dark:bg-green-400/20'
    if (percentage >= 50) return 'bg-blue-500/20 dark:bg-blue-400/20'
    if (percentage >= 25) return 'bg-yellow-500/20 dark:bg-yellow-400/20'
    return 'bg-gray-400/20 dark:bg-gray-500/20'
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded"
      title={`${orgValue} (${pct}%)`}
      aria-label={`${orgValue} (${pct}%)`}
      aria-roledescription="background-bar"
    >
      {/* Background bar - reduced height, color based on percentage */}
      <div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded transition-all',
          getBarColor(pct as number)
        )}
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
      <span className="relative inline-block min-w-0 truncate px-1">
        {options?.numberFormat
          ? formatReadableQuantity(value as number, 'long')
          : value}
      </span>
    </div>
  )
})
