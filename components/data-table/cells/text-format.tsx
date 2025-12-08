import { cn } from '@/lib/utils'

export interface TextFormatOptions {
  className?: string
}

interface TextFormatProps {
  value: React.ReactNode
  options?: TextFormatOptions
}

export function TextFormat({
  value,
  options,
}: TextFormatProps): React.ReactNode {
  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      {`${value ? value : ''}`}
    </span>
  )
}
