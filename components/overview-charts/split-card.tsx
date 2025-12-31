'use client'

import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { cardStyles } from './card-styles'

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

export const SplitValue = memo(function SplitValue({ value, label, href }: SplitValueProps) {
  const content = (
    <div className="group flex flex-1 flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80 min-w-0 text-center">
      <AnimatedNumber value={value} className={cardStyles.number} />
      <span className={cardStyles.label}>{label}</span>
      {href && <span className={cardStyles.labelHover}>{label.toLowerCase()} →</span>}
    </div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }
  return content
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
