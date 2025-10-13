import { formatDuration } from '@/lib/date-utils'

interface DurationFormatProps {
  value: unknown
}

export function DurationFormat({ value }: DurationFormatProps) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span>-</span>
  }

  // Parse value to number
  const seconds = typeof value === 'number' ? value : parseFloat(String(value))

  // Handle invalid numbers
  if (isNaN(seconds)) {
    return <span title={String(value)}>{String(value)}</span>
  }

  const formatted = formatDuration(seconds, { precision: 2 })

  return (
    <span title={`${seconds} seconds`} className="tabular-nums">
      {formatted}
    </span>
  )
}
