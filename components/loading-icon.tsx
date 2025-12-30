import { memo } from 'react'
import { UpdateIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

interface LoadingIconProps {
  className?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
}

const sizeClasses = {
  sm: 'size-3',
  default: 'size-4',
  lg: 'size-5',
}

export const LoadingIcon = memo(function LoadingIcon({
  className,
  size = 'default',
}: LoadingIconProps) {
  return (
    <UpdateIcon
      className={cn(
        sizeClasses[size],
        'animate-spin text-muted-foreground/70',
        'motion-reduce:animate-none',
        className
      )}
      data-testid="loading-indicator"
      role="status"
      aria-label="Loading"
      aria-hidden="false"
    />
  )
})
