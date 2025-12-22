import { cn } from '@/lib/utils'

export interface ColoredBadgeOptions {
  className?: string
}

interface ColoredBadgeFormatProps {
  value: React.ReactNode
  options?: ColoredBadgeOptions
}

const BADGE_COLORS = [
  { bg: '--badge-success-bg', text: '--badge-success-text' },
  { bg: '--badge-warning-bg', text: '--badge-warning-text' },
  { bg: '--badge-info-bg', text: '--badge-info-text' },
  { bg: '--badge-primary-bg', text: '--badge-primary-text' },
  { bg: '--badge-secondary-bg', text: '--badge-secondary-text' },
  { bg: '--badge-tertiary-bg', text: '--badge-tertiary-text' },
]

export function ColoredBadgeFormat({
  value,
  options,
}: ColoredBadgeFormatProps): React.ReactNode {
  if (!value || value === '') {
    return null
  }

  // Picked consistently based on the value
  const colorIndex =
    Math.abs(
      value
        .toString()
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    ) % BADGE_COLORS.length

  const pickedColor = BADGE_COLORS[colorIndex]

  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        options?.className
      )}
      style={{
        backgroundColor: `hsl(var(${pickedColor.bg}))`,
        color: `hsl(var(${pickedColor.text}))`,
      }}
    >
      {value}
    </span>
  )
}
