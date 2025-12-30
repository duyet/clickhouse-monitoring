import { cn } from '@/lib/utils'
import { memo, useMemo } from 'react'

export interface ColoredBadgeOptions {
  className?: string
}

interface ColoredBadgeFormatProps {
  value: React.ReactNode
  options?: ColoredBadgeOptions
}

export const ColoredBadgeFormat = memo(function ColoredBadgeFormat({
  value,
  options,
}: ColoredBadgeFormatProps): React.ReactNode {
  if (!value || value === '') {
    return null
  }

  // Memoize expensive color calculation
  const pickedColor = useMemo(() => {
    const colors = [
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
    ]

    // Picked consistently based on the value
    return colors[
      Math.abs(
        value
          .toString()
          .split('')
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      ) % colors.length
    ]
  }, [value])

  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        pickedColor,
        options?.className
      )}
    >
      {value}
    </span>
  )
})
