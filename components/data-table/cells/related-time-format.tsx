import { memo, useMemo } from 'react'
import { useTimezone } from '@/lib/context/timezone-context'
import dayjs from '@/lib/dayjs'

interface RelatedTimeFormatProps {
  value: any
}

export const RelatedTimeFormat = memo(function RelatedTimeFormat({
  value,
}: RelatedTimeFormatProps) {
  const userTimezone = useTimezone()

  // Memoize dayjs computation
  const fromNow = useMemo(() => {
    try {
      // Parse in user's timezone
      const parsed = dayjs.tz(value as string, userTimezone)
      return parsed.fromNow()
    } catch (_e) {
      // Failed to parse time with timezone, fallback to default parsing
      return dayjs(value as string).fromNow()
    }
  }, [value, userTimezone])

  return <span title={value as string}>{fromNow}</span>
})
