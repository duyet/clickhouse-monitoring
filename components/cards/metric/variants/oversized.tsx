import type { ReactNode } from 'react'

import { AnimatedNumber } from '../animated-number'
import { extractValue } from '../utils'
import { cn } from '@/lib/utils'

interface RenderProps<T> {
  value: string | number | ((data: T[]) => string | number) | undefined
  unit: string | undefined
  data: T[]
  compact: boolean
}

export function renderOversizedVariant<T>({
  value,
  unit,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const resolvedValue = extractValue(value, data)

  return (
    <div className="flex items-baseline justify-center gap-1">
      <AnimatedNumber
        value={resolvedValue}
        className={cn(
          'font-mono font-black tabular-nums tracking-tighter',
          'text-foreground/50 dark:text-foreground/40',
          compact
            ? 'text-4xl sm:text-5xl lg:text-6xl'
            : 'text-5xl sm:text-6xl lg:text-7xl'
        )}
      />
      {unit && (
        <span
          className={cn(
            'font-medium text-foreground/30',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {unit}
        </span>
      )}
    </div>
  )
}
