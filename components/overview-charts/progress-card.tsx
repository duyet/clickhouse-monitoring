'use client'

import {
  type CardVariant,
  cardStyles,
  progressColors,
  variantStyles,
} from './card-styles'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { cn } from '@/lib/utils'

// ============================================================================
// ProgressCard Component
// ============================================================================

/**
 * ProgressCard - A card with a value and progress bar
 * Used for displaying usage metrics like disk space
 */

export interface ProgressCardProps {
  value: string | number
  percent: number
  href?: string
  variant?: CardVariant
  isLoading?: boolean
}

export const ProgressCard = memo(function ProgressCard({
  value,
  percent,
  href,
  variant = 'default',
  isLoading,
}: ProgressCardProps) {
  if (isLoading) {
    return (
      <div className={cn(cardStyles.base, 'group p-3')}>
        <div className="flex flex-1 flex-col justify-center gap-1 sm:gap-2">
          <div className="flex justify-center">
            <div className="h-10 w-16 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-10 animate-pulse rounded bg-muted/20" />
              <div className="h-3 w-8 animate-pulse rounded bg-muted/20" />
            </div>
            <div className="h-2 sm:h-3 w-full animate-pulse rounded-full bg-muted/30" />
          </div>
        </div>
      </div>
    )
  }

  const content = (
    <div
      className={cn(
        cardStyles.base,
        'group p-3',
        href && cardStyles.hover,
        variantStyles[variant]
      )}
    >
      <div className="flex flex-1 flex-col justify-center gap-1 sm:gap-2">
        {/* Value display */}
        <div className="text-center">
          <AnimatedNumber value={value} className={cardStyles.number} />
        </div>

        {/* Progress bar */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-foreground/60">
            <span className={cn(cardStyles.label, 'group-hover:hidden')}>
              Used
            </span>
            {href ? (
              <Link
                href={href}
                className={cn(
                  cardStyles.label,
                  'hidden group-hover:inline text-foreground/90 uppercase tracking-wider truncate'
                )}
              >
                Go to disks →
              </Link>
            ) : null}
            <span className="tabular-nums shrink-0">{percent.toFixed(0)}%</span>
          </div>
          <div className="h-2 sm:h-3 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progressColors[variant]
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return content
})
