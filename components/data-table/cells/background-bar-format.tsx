import { formatReadableQuantity } from '@/lib/format-readable'

export interface BackgroundBarOptions {
  numberFormat?: boolean
}

interface BackgroundBarFormatProps {
  table: unknown
  row: unknown
  columnName: string
  value: unknown
  options?: BackgroundBarOptions
}

export function BackgroundBarFormat({
  table,
  row,
  columnName,
  value,
  options,
}: BackgroundBarFormatProps) {
  // Handle null/undefined value
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }

  // Type guard for table
  const hasGetCoreRowModel = (
    t: unknown
  ): t is { getCoreRowModel: () => { rows?: unknown[] } } => {
    return (
      typeof t === 'object' &&
      t !== null &&
      'getCoreRowModel' in t &&
      typeof (t as { getCoreRowModel: unknown }).getCoreRowModel === 'function'
    )
  }

  // Type guard for row
  const hasOriginal = (
    r: unknown
  ): r is { original: Record<string, unknown> } => {
    return (
      typeof r === 'object' &&
      r !== null &&
      'original' in r &&
      typeof (r as { original: unknown }).original === 'object'
    )
  }

  // Disable if row count <= 1
  if (hasGetCoreRowModel(table)) {
    const rows = table.getCoreRowModel()?.rows
    if (!rows || rows.length <= 1) {
      return String(value)
    }
  } else {
    return String(value)
  }

  if (!hasOriginal(row)) {
    console.warn('BackgroundBarFormat: row does not have original data')
    return String(value)
  }

  // Looking at pct_{columnName} for the value
  const colName = columnName.replace('readable_', '')
  const pctColName = `pct_${colName}`
  const pct = row.original[pctColName]
  const orgValue = row.original[colName]

  if (pct === undefined || pct === null) {
    console.warn(
      `${pctColName} is not defined, you should configure it in the query`
    )
    return String(value)
  }

  // Ensure pct is a valid number
  const pctNumber = typeof pct === 'number' ? pct : parseFloat(String(pct))
  if (isNaN(pctNumber)) {
    return String(value)
  }

  const bgColor = '#F8F4F0'

  // Ensure value is properly typed for formatReadableQuantity
  const numericValue =
    typeof value === 'number' ? value : parseFloat(String(value))
  const displayValue =
    options?.numberFormat && !isNaN(numericValue)
      ? formatReadableQuantity(numericValue, 'long')
      : String(value)

  return (
    <div
      className="w-full rounded p-1"
      style={{
        background: `linear-gradient(to right,
                ${bgColor} 0%, ${bgColor} ${pctNumber}%,
                transparent ${pctNumber}%, transparent 100%)`,
      }}
      title={`${String(orgValue)} (${pctNumber}%)`}
      aria-label={`${String(orgValue)} representing ${pctNumber}% of total`}
      role="progressbar"
      aria-valuenow={pctNumber}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {displayValue}
    </div>
  )
}
