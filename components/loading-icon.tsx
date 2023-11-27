import { UpdateIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

interface LoadingIconProps {
  className?: string
}

export function LoadingIcon({ className }: LoadingIconProps) {
  return (
    <UpdateIcon
      className={cn('h-3 w-3 animate-spin text-gray-400', className)}
    />
  )
}
