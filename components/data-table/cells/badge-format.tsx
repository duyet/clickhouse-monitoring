import { cn } from '@/lib/utils'
import { memo } from 'react'

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
        'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800',
        className
      )}
    >
      {value}
    </span>
  )
})
