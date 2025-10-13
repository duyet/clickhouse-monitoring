import { cn } from '@/lib/utils'

export interface ColoredBadgeOptions {
  className?: string
}

interface ColoredBadgeFormatProps {
  value: unknown
  options?: ColoredBadgeOptions
}

export function ColoredBadgeFormat({
  value,
  options,
}: ColoredBadgeFormatProps) {
  // Handle null/undefined or empty string
  if (value === null || value === undefined || value === '') {
    return null
  }

  const colors = [
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
  ]

  // Convert to string safely
  const stringValue = String(value)

  // Picked consistently based on the value
  const hash = stringValue
    .split('')
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)

  const colorIndex = Math.abs(hash) % colors.length
  const pickedColor = colors[colorIndex]

  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        pickedColor,
        options?.className
      )}
      role="status"
      aria-label={`Badge: ${stringValue}`}
    >
      {stringValue}
    </span>
  )
}
