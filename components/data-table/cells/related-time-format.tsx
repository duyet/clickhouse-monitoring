import dayjs from '@/lib/dayjs'

interface RelatedTimeFormatProps {
  value: any
  timezone?: string
}

// Use only NEXT_PUBLIC_ variables that are available in client components
const CLICKHOUSE_TZ: string = process.env.NEXT_PUBLIC_CLICKHOUSE_TZ || ''

export function RelatedTimeFormat({ value, timezone }: RelatedTimeFormatProps) {
  const tz = timezone || CLICKHOUSE_TZ
  let fromNow
  try {
    let parsed = tz ? dayjs.tz(value as string, tz) : dayjs(value as string)
    fromNow = parsed.fromNow()
  } catch (e) {
    console.error('Error parsing time:', e)
    fromNow = dayjs(value as string).fromNow()
  }

  return <span title={value as string}>{fromNow}</span>
}
