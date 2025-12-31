import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { extractValue } from '../utils'
import { AnimatedNumber } from '../animated-number'

interface RenderProps<T> {
  value: string | number | ((data: T[]) => string | number) | undefined
  trend: number | ((data: T[]) => number) | undefined
  trendLabel: string | ((data: T[]) => string) | undefined
  data: T[]
  compact: boolean
}

export function renderTrendVariant<T>({
  value,
  trend,
  trendLabel,
  data,
  compact,
}: RenderProps<T>): ReactNode {
  const resolvedValue = extractValue(value, data)
  const resolvedTrend = typeof trend === 'function' ? trend(data) : trend
  const resolvedTrendLabel =
    typeof trendLabel === 'function' ? trendLabel(data) : trendLabel

  // Handle undefined trend by treating it as neutral (no trend shown)
  const trendValue = resolvedTrend ?? 0
  const isPositive = trendValue > 0
  const isNeutral = trendValue === 0

  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <AnimatedNumber
          value={resolvedValue}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            compact ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl'
          )}
        />
        {!isNeutral && (
          <div
            className={cn(
              'flex items-center gap-0.5 font-medium',
              compact ? 'text-[10px]' : 'text-xs',
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isPositive ? (
              <TrendingUpIcon className={cn(compact ? 'size-2.5' : 'size-3')} />
            ) : (
              <TrendingDownIcon
                className={cn(compact ? 'size-2.5' : 'size-3')}
              />
            )}
            <span className="font-mono tabular-nums">
              {Math.abs(trendValue).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {resolvedTrendLabel && (
        <div
          className={cn(
            'text-muted-foreground',
            compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
          )}
        >
          {resolvedTrendLabel}
        </div>
      )}
    </div>
  )
}
