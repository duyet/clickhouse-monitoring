'use client'

import { cardStyles } from './card-styles'
import { memo } from 'react'
import { ExpandableText } from '@/components/utilities/expandable-text'
import { cn } from '@/lib/utils'

export interface InfoCardProps {
  value: string
  subtitle?: string
  isLoading?: boolean
}

export const InfoCard = memo(function InfoCard({
  value,
  subtitle,
  isLoading,
}: InfoCardProps) {
  if (isLoading) {
    return (
      <div className={cn(cardStyles.base, 'p-3 sm:p-4')}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="h-8 w-20 animate-pulse rounded-md bg-foreground/[0.06]" />
          <div className="h-3 w-16 animate-pulse rounded bg-foreground/[0.04]" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(cardStyles.base, 'p-3 sm:p-4')}>
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
        <div className="text-center">
          <div className={cardStyles.number}>{value}</div>
        </div>
        {subtitle && (
          <ExpandableText
            variant="inline"
            maxLines={1}
            className={cn(
              'text-center text-xs uppercase tracking-widest font-medium',
              'text-foreground/40 dark:text-foreground/35',
              'max-w-full px-2'
            )}
          >
            {subtitle}
          </ExpandableText>
        )}
      </div>
    </div>
  )
})
