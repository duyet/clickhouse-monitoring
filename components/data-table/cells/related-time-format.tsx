import dayjs from '@/lib/dayjs'

interface RelatedTimeFormatProps {
  value: any
}

const CLICKHOUSE_TZ: string =
  process.env.NEXT_PUBLIC_CLICKHOUSE_TZ || process.env.CLICKHOUSE_TZ || ''

export function RelatedTimeFormat({ value }: RelatedTimeFormatProps) {
  let fromNow
  try {
    const parsed = dayjs.tz(value as string, CLICKHOUSE_TZ)
    fromNow = parsed.fromNow()
  } catch (_e) {
    // Failed to parse time with timezone, fallback to default parsing
    fromNow = dayjs(value as string).fromNow()
  }

  return <span title={value as string}>{fromNow}</span>
}
