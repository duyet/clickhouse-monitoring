'use client'

import {
  type CardVariant,
  cardStyles,
  progressColors,
  progressFillStyles,
  progressTrackStyles,
  variantStyles,
} from './card-styles'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { cn } from '@/lib/utils'

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
      <div className={cn(cardStyles.base, 'group p-3 sm:p-4')}>
        <div className="flex flex-1 flex-col justify-center gap-2 sm:gap-3">
          <div className="flex justify-center">
            <div className="h-8 w-16 animate-pulse rounded-md bg-foreground/[0.06]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-10 animate-pulse rounded bg-foreground/[0.04]" />
              <div className="h-3 w-8 animate-pulse rounded bg-foreground/[0.04]" />
            </div>
            <div className={cn(progressTrackStyles, 'animate-pulse')} />
          </div>
        </div>
      </div>
    )
  }

  const clampedPercent = Math.min(Math.max(percent, 0), 100)

  const content = (
    <div
      className={cn(
        cardStyles.base,
        'group p-3 sm:p-4',
        href && cardStyles.hover,
        variantStyles[variant]
      )}
    >
      <div className="flex flex-1 flex-col justify-center gap-2 sm:gap-3">
        <div className="text-center">
          <AnimatedNumber value={value} className={cardStyles.number} />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className={cardStyles.label}>Used</span>
            {href ? (
              <Link href={href} className={cardStyles.labelHover}>
                disks →
              </Link>
            ) : null}
            <span
              className={cn(
                'text-[10px] font-medium tabular-nums',
                'text-foreground/60 dark:text-foreground/50',
                clampedPercent >= 90 && 'text-rose-500 dark:text-rose-400',
                clampedPercent >= 75 &&
                  clampedPercent < 90 &&
                  'text-amber-500 dark:text-amber-400'
              )}
            >
              {clampedPercent.toFixed(0)}%
            </span>
          </div>
          <div className={progressTrackStyles}>
            <div
              className={cn(progressFillStyles, progressColors[variant])}
              style={
                {
                  width: `${clampedPercent}%`,
                  '--progress-width': `${clampedPercent}%`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
    </div>
  )

  return content
})
