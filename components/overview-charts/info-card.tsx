'use client'

import { memo } from 'react'
import { cardStyles } from './card-styles'

// ============================================================================
// InfoCard Component
// ============================================================================

/**
 * InfoCard - A simple info card with value and optional subtitle
 * Used for displaying static info like version number
 */

export interface InfoCardProps {
  value: string
  subtitle?: string
  isLoading?: boolean
}

export const InfoCard = memo(function InfoCard({ value, subtitle, isLoading }: InfoCardProps) {
  if (isLoading) {
    return (
      <div className={cardStyles.base}>
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <div className="h-10 w-20 animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted/20" />
        </div>
      </div>
    )
  }

  return (
    <div className={cardStyles.base}>
      <div className="text-center">
        <div className={cardStyles.number}>{value}</div>
      </div>
      {subtitle && (
        <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/50 line-clamp-1">
          {subtitle}
        </div>
      )}
    </div>
  )
})
