import type { ReactNode } from 'react'

import { AnimatedNumber } from '../animated-number'
import { extractValue } from '../utils'
import { cn } from '@/lib/utils'

interface RenderProps<T> {
  value1: string | number | ((data: T[]) => string | number) | undefined
  label1: string | undefined
  value2: string | number | ((data: T[]) => string | number) | undefined
  label2: string | undefined
  data: T[]
  compact: boolean
}

export function renderSplitVariant<T>({
  value1,
  label1,
  value2,
  label2,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const v1 = extractValue(value1, data)
  const v2 = extractValue(value2, data)

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      {/* Left side */}
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber
          value={v1}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            'text-foreground/70 dark:text-foreground/60',
            compact
              ? 'text-2xl sm:text-3xl lg:text-4xl'
              : 'text-3xl sm:text-4xl lg:text-5xl'
          )}
        />
        {label1 && (
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-wide',
              'text-foreground/40'
            )}
          >
            {label1}
          </span>
        )}
      </div>

      {/* Vertical divider */}
      <div
        className={cn(
          'h-8 w-px bg-border/60',
          compact ? 'h-6' : 'h-10 sm:h-12'
        )}
      />

      {/* Right side */}
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber
          value={v2}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            'text-foreground/70 dark:text-foreground/60',
            compact
              ? 'text-2xl sm:text-3xl lg:text-4xl'
              : 'text-3xl sm:text-4xl lg:text-5xl'
          )}
        />
        {label2 && (
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-wide',
              'text-foreground/40'
            )}
          >
            {label2}
          </span>
        )}
      </div>
    </div>
  )
}
