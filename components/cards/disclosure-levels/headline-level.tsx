'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * HeadlineLevel - Level 1: Big KPI display with optional sparkline
 *
 * Shows the primary metric in a large, readable format.
 * This is the default collapsed state.
 */

export interface HeadlineLevelProps {
  /** Primary value to display (e.g., "15", "2.5GB") */
  value: string | number
  /** Label for the metric (e.g., "Running Queries") */
  label: string
  /** Optional sparkline data points */
  sparklineData?: number[]
  /** Optional trend indicator (+5%, -2%) */
  trend?: {
    value: number // Percentage change
    label?: string // Optional label like "vs last hour"
  }
  /** Optional click handler (to expand) */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

export const HeadlineLevel = memo(function HeadlineLevel({
  value,
  label,
  trend,
  onClick,
  className,
}: HeadlineLevelProps) {
  const trendColor =
    trend && trend.value > 0
      ? 'text-emerald-500'
      : trend && trend.value < 0
        ? 'text-rose-500'
        : 'text-muted-foreground'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 py-2 px-1 w-full min-w-0 text-center',
        'transition-all duration-200 ease-out',
        onClick && 'cursor-pointer hover:bg-foreground/[0.03] rounded-lg',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${label}: ${value}. Click for more details.`}
    >
      {/* Main value */}
      <div
        className={cn(
          'font-mono font-semibold tabular-nums tracking-tight',
          'text-foreground/90 dark:text-foreground/80',
          'text-lg sm:text-xl md:text-2xl lg:text-3xl',
          'line-clamp-1',
          '[text-shadow:0_1px_2px_rgba(0,0,0,0.05)]',
          'dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]'
        )}
      >
        {value}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-[10px] uppercase tracking-widest font-medium',
          'text-foreground/45'
        )}
      >
        {label}
      </span>

      {/* Optional trend */}
      {trend && (
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            'flex items-center gap-0.5',
            trendColor
          )}
        >
          {trend.value > 0 ? '+' : ''}
          {trend.value}%
          {trend.label && (
            <span className="text-muted-foreground text-[10px] ml-1">
              {trend.label}
            </span>
          )}
        </span>
      )}
    </div>
  )
})
