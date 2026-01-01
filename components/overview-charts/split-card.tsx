'use client'

import { cardStyles } from './card-styles'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { cn } from '@/lib/utils'

// ============================================================================
// SplitValue Component
// ============================================================================

/**
 * SplitValue - A single value in a split card
 * Displays an animated number with label and hover effect
 */

export interface SplitValueProps {
  value: number | string
  label: string
  href?: string
}

export const SplitValue = memo(function SplitValue({
  value,
  label,
  href,
}: SplitValueProps) {
  return (
    <div
      className={cn(
        'group flex flex-1 flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80 w-full min-w-0 text-center',
        cardStyles.hover
      )}
    >
      <AnimatedNumber value={value} className={cardStyles.number} />

      <span className={cardStyles.label}>{label}</span>

      {href && (
        <Link href={href} className={cardStyles.labelHover}>
          {label.toLowerCase()} →
        </Link>
      )}
    </div>
  )
})

// ============================================================================
// SplitCard Component
// ============================================================================

/**
 * SplitCard - A card with two values side by side
 * Used for displaying related metrics like "Running / Today" or "Databases / Tables"
 */

export interface SplitCardProps {
  value1: number | string
  label1: string
  value2: number | string
  label2: string
  href1?: string
  href2?: string
}

export const SplitCard = memo(function SplitCard({
  value1,
  label1,
  value2,
  label2,
  href1,
  href2,
}: SplitCardProps) {
  return (
    <div className={cardStyles.base}>
      <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-3 md:gap-6">
        <SplitValue value={value1} label={label1} href={href1} />
        <div className={cardStyles.divider} />
        <SplitValue value={value2} label={label2} href={href2} />
      </div>
    </div>
  )
})
