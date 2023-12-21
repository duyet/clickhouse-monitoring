import { cn } from '@/lib/utils'

interface BackgroundBarFormatProps {
  table: any
  row: any
  columnName: string
  value: any
}

export function BackgroundBarFormat({
  table,
  row,
  columnName,
  value,
}: BackgroundBarFormatProps) {
  // Disable if row count <= 1
  if (table.getCoreRowModel()?.rows?.length <= 1) return value

  // Looking at pct_{columnName} for the value
  const colName = columnName.replace('readable_', '')
  const pctColName = `pct_${colName}`
  const pct = row.original[pctColName]

  if (pct === undefined) {
    console.warn(
      `${pctColName} is not defined, you should configure it in the query`
    )
    return value
  }

  return (
    <div className="relative flex h-7 w-full">
      <div
        className={cn(
          'absolute inset-0 rounded bg-gray-100',
          `w-[calc(${pct}%)]`
        )}
        style={{ width: `${pct}%` }}
      ></div>
      <div className="absolute inset-0 z-10 p-1 align-middle">{value}</div>
    </div>
  )
}
