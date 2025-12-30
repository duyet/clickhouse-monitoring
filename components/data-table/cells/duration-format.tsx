import dayjs from '@/lib/dayjs'
import { memo, useMemo } from 'react'

interface DurationFormatProps {
  value: string | number
}

export const DurationFormat = memo(function DurationFormat({
  value,
}: DurationFormatProps): React.ReactNode {
  // Memoize dayjs computation
  const humanized = useMemo(() => {
    const seconds = parseFloat(value as string)

    if (Number.isNaN(seconds)) {
      return value
    }

    return dayjs.duration({ seconds }).humanize(seconds < 0) // 2 minutes "ago" for negative values
  }, [value])

  return <span title={value as string}>{humanized}</span>
})
