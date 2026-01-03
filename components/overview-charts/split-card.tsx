'use client'

import { cardStyles } from './card-styles'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { cn } from '@/lib/utils'

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
        'group/value flex flex-1 flex-col items-center justify-center gap-1.5 w-full min-w-0 text-center',
        'py-2 px-1 rounded-lg',
        'transition-all duration-150 ease-out',
        'hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.05]',
        href && 'cursor-pointer'
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

export interface SplitCardProps {
  value1: number | string
  label1: string
  value2: number | string
  label2: string
  href1?: string
  href2?: string
  isLoading?: boolean
}

export const SplitCard = memo(function SplitCard({
  value1,
  label1,
  value2,
  label2,
  href1,
  href2,
  isLoading,
}: SplitCardProps) {
  if (isLoading) {
    return (
      <div className={cn(cardStyles.base, 'p-2 sm:p-3')}>
        <div className="flex flex-1 items-center justify-center gap-2 sm:gap-4">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
            <div className="h-8 w-12 animate-pulse rounded-md bg-foreground/[0.06]" />
            <div className="h-3 w-14 animate-pulse rounded bg-foreground/[0.04]" />
          </div>
          <div className={cardStyles.divider} />
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
            <div className="h-8 w-12 animate-pulse rounded-md bg-foreground/[0.06]" />
            <div className="h-3 w-14 animate-pulse rounded bg-foreground/[0.04]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(cardStyles.base, 'p-2 sm:p-3')}>
      <div className="flex flex-1 items-center justify-center gap-2 sm:gap-4">
        <SplitValue value={value1} label={label1} href={href1} />
        <div className={cardStyles.divider} />
        <SplitValue value={value2} label={label2} href={href2} />
      </div>
    </div>
  )
})
