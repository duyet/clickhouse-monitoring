import { cn } from '@/lib/utils'
import { memo } from 'react'

export interface TextFormatOptions {
  className?: string
}

interface TextFormatProps {
  value: React.ReactNode
  options?: TextFormatOptions
}

export const TextFormat = memo(function TextFormat({
  value,
  options,
}: TextFormatProps): React.ReactNode {
  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      {`${value ? value : ''}`}
    </span>
  )
})
