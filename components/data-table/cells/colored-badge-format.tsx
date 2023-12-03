import { cn } from '@/lib/utils'

interface ColoredBadgeFormatProps {
  value: any
  className?: string
}

export function ColoredBadgeFormat({
  value,
  className,
}: ColoredBadgeFormatProps) {
  const colors = [
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
  ]

  // Picked consistently based on the value
  const pickedColor =
    colors[
      Math.abs(
        value
          .toString()
          .split('')
          .reduce((acc: string, char: string) => acc + char.charCodeAt(0), 0)
      ) % colors.length
    ]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        pickedColor,
        className
      )}
    >
      {value}
    </span>
  )
}
