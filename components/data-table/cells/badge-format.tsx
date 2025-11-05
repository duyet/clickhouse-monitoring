import { cn } from '@/lib/utils'

interface BadgeFormatProps {
  value: unknown
  className?: string
}

export function BadgeFormat({ value, className }: BadgeFormatProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800',
        className
      )}
    >
      {value}
    </span>
  )
}
