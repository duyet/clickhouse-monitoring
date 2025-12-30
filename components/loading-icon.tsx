import { memo } from 'react'
import { UpdateIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

interface LoadingIconProps {
  className?: string
}

export const LoadingIcon = memo(function LoadingIcon({ className }: LoadingIconProps) {
  return (
    <UpdateIcon
      className={cn('size-3 animate-spin text-gray-400', className)}
      data-testid="loading-indicator"
      role="status"
      aria-label="Loading"
      aria-hidden="false"
    />
  )
})
