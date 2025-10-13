import { cn } from '@/lib/utils'

export interface TextFormatOptions {
  className?: string
}

interface TextFormatProps {
  value: unknown
  options?: TextFormatOptions
}

export function TextFormat({ value, options }: TextFormatProps) {
  // Handle null/undefined explicitly
  if (value === null || value === undefined) {
    return (
      <span
        className={cn(
          'text-muted-foreground truncate text-wrap',
          options?.className
        )}
      >
        -
      </span>
    )
  }

  // Convert value to string safely
  const displayValue = String(value)

  return (
    <span className={cn('truncate text-wrap', options?.className)}>
      {displayValue}
    </span>
  )
}
