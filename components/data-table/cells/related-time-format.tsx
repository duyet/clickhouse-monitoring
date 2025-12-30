import dayjs from '@/lib/dayjs'
import { memo, useMemo } from 'react'

interface RelatedTimeFormatProps {
  value: any
}

const CLICKHOUSE_TZ: string =
  process.env.NEXT_PUBLIC_CLICKHOUSE_TZ || process.env.CLICKHOUSE_TZ || ''

export const RelatedTimeFormat = memo(function RelatedTimeFormat({ value }: RelatedTimeFormatProps) {
  // Memoize dayjs computation
  const fromNow = useMemo(() => {
    try {
      const parsed = dayjs.tz(value as string, CLICKHOUSE_TZ)
      return parsed.fromNow()
    } catch (_e) {
      // Failed to parse time with timezone, fallback to default parsing
      return dayjs(value as string).fromNow()
    }
  }, [value])

  return <span title={value as string}>{fromNow}</span>
})
