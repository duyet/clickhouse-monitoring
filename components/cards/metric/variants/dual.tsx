import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { extractValue } from '../utils'
import { AnimatedNumber } from '../animated-number'

interface RenderProps<T> {
  value1: string | number | ((data: T[]) => string | number) | undefined
  unit1: string | undefined
  value2: string | number | ((data: T[]) => string | number) | undefined
  unit2: string | undefined
  data: T[]
  compact: boolean
}

export function renderDualVariant<T>({
  value1,
  unit1,
  value2,
  unit2,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const v1 = extractValue(value1, data)
  const v2 = extractValue(value2, data)

  return (
    <div className={cn('space-y-1', compact && 'space-y-0.5')}>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={v1}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
          )}
        />
        {unit1 && (
          <span
            className={cn(
              'text-muted-foreground',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            {unit1}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <AnimatedNumber
          value={v2}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
          )}
        />
        {unit2 && (
          <span
            className={cn(
              'text-muted-foreground',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            {unit2}
          </span>
        )}
      </div>
    </div>
  )
}
