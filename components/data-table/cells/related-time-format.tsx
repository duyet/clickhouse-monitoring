import dayjs from '@/lib/dayjs'

interface RelatedTimeFormatProps {
  value: any
}

let tz: string

export async function RelatedTimeFormat({ value }: RelatedTimeFormatProps) {
  let fromNow
  try {
    if (!tz) {
      // Getting timezone from server
      tz = await fetch('/api/timezone')
        .then((res) => res.json())
        .then((data) => data.tz)
      console.log('Server timezone:', tz)
    }

    let parsed = dayjs.tz(value as string, tz)
    fromNow = parsed.fromNow()
  } catch (e) {
    console.error('Error parsing time:', e)
    fromNow = dayjs(value as string).fromNow()
  }

  return <span title={value as string}>{fromNow}</span>
}
