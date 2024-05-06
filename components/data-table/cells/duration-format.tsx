import dayjs from '@/lib/dayjs'

interface DurationFormatProps {
  value: any
}

export async function DurationFormat({ value }: DurationFormatProps) {
  let humanized = dayjs
    .duration({ seconds: parseFloat(value as string) })
    .humanize()

  return <span title={value as string}>{humanized}</span>
}
