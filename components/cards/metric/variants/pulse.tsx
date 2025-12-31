import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { extractValue } from '../utils'
import { AnimatedNumber } from '../animated-number'
import { Sparkline } from './pulse-sparkline'

interface RenderProps<T> {
  value: string | number | ((data: T[]) => string | number) | undefined
  unit: string | undefined
  trend: number | ((data: T[]) => number) | undefined
  trendLabel: string | ((data: T[]) => string) | undefined
  data: T[]
  compact: boolean
  // New props for pulse variant
  history?: number[]
  historyLabel?: string
  showSparkline?: boolean
}

export function renderPulseVariant<T>({
  value,
  unit,
  trend,
  trendLabel,
  data,
  compact,
  history = [],
  historyLabel = '24h',
  showSparkline = true,
}: RenderProps<T>): ReactNode {
  const resolvedValue = extractValue(value, data)
  const resolvedTrend = typeof trend === 'function' ? trend(data) : trend
  const resolvedTrendLabel =
    typeof trendLabel === 'function' ? trendLabel(data) : trendLabel

  const trendValue = resolvedTrend ?? 0
  const isPositive = trendValue > 0
  const isNeutral = trendValue === 0

  // Use consistent semantic colors
  const trendColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400'

  const trendBg = isPositive
    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'

  return (
    <div className="space-y-3">
      {/* Main value */}
      <div className="flex items-baseline gap-1.5">
        <AnimatedNumber
          value={resolvedValue}
          className={cn(
            'font-mono font-bold tabular-nums tracking-tight',
            compact ? 'text-xl' : 'text-2xl'
          )}
        />
        {unit && (
          <span
            className={cn(
              'text-muted-foreground font-medium',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Trend indicator with sparkline */}
      <div className="space-y-2">
        {!isNeutral && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md',
                'font-medium tabular-nums text-xs',
                'border',
                trendBg,
                trendColor
              )}
            >
              {isPositive ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              <span>{Math.abs(trendValue).toFixed(1)}%</span>
            </div>
            {resolvedTrendLabel && (
              <span className="text-muted-foreground text-xs">
                {resolvedTrendLabel}
              </span>
            )}
          </div>
        )}

        {isNeutral && resolvedTrendLabel && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <MinusIcon className="size-3" />
            <span>{resolvedTrendLabel}</span>
          </div>
        )}

        {/* Sparkline for historical data */}
        {showSparkline && history.length > 0 && (
          <Sparkline
            data={history}
            color={isPositive ? 'hsl(142 76% 36%)' : 'hsl(350 89% 60%)'}
            compact={compact}
          />
        )}
      </div>
    </div>
  )
}
