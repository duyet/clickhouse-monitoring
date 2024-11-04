import dayjs from '@/lib/dayjs'

interface RelatedTimeFormatProps {
  value: any
}

const CLICKHOUSE_TZ: string = process.env.CLICKHOUSE_TZ || ''

export function RelatedTimeFormat({ value }: RelatedTimeFormatProps) {
  let fromNow
  try {
    let parsed = dayjs.tz(value as string, CLICKHOUSE_TZ)
    fromNow = parsed.fromNow()
  } catch (e) {
    console.error('Error parsing time:', e)
    fromNow = dayjs(value as string).fromNow()
  }

  return <span title={value as string}>{fromNow}</span>
}
