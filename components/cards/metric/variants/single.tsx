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

export function renderSingleVariant<T>({
  value,
  unit,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const resolvedValue = extractValue(value, data)

  return (
    <div className="flex items-baseline gap-1">
      <AnimatedNumber
        value={resolvedValue}
        className={cn(
          'font-mono font-bold tabular-nums tracking-tight',
          compact ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl'
        )}
      />
      {unit && (
        <span
          className={cn(
            'text-muted-foreground',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {unit}
        </span>
      )}
    </div>
  )
}
