import { memo } from 'react'
import { cn } from '@/lib/utils'

interface BadgeFormatProps {
  value: React.ReactNode
  className?: string
}

export const BadgeFormat = memo(function BadgeFormat({
  value,
  className,
}: BadgeFormatProps): React.ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        'bg-green-100 text-green-800',
        'dark:bg-green-900/30 dark:text-green-300',
        className
      )}
    >
      {value}
    </span>
  )
})
