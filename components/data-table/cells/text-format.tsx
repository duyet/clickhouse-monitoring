import { cn } from '@/lib/utils'

export interface TextFormatOptions {
  className?: string
}

interface TextFormatProps {
  value: unknown
  options?: TextFormatOptions
}

export function TextFormat({ value, options }: TextFormatProps) {
  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      {`${!!value ? value : ''}`}
    </span>
  )
}
