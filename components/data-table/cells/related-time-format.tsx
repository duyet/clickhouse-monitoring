import { formatDate, formatRelativeTime, parseDate } from '@/lib/date-utils'

interface RelatedTimeFormatProps {
  value: unknown
}

export function RelatedTimeFormat({ value }: RelatedTimeFormatProps) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span>-</span>
  }

  // Validate the date
  const date = parseDate(value as string | number | Date)
  if (!date) {
    return <span title={String(value)}>Invalid date</span>
  }

  const relativeTime = formatRelativeTime(date)
  const absoluteTime = formatDate(date, { includeSeconds: true })

  return (
    <span title={absoluteTime} className="cursor-help">
      {relativeTime}
    </span>
  )
}
