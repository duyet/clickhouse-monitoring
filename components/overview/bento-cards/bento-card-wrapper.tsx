'use client'

import { cardStyles } from '@/components/overview-charts/card-styles'
import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BentoCardWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * BentoCardWrapper - Consistent card styling for all bento grid items
 * Provides the base card appearance with proper borders, shadows, and backdrop
 */
export const BentoCardWrapper = memo(function BentoCardWrapper({
  children,
  className,
}: BentoCardWrapperProps) {
  return (
    <div className={cn(cardStyles.base, 'flex flex-col', className)}>
      {children}
    </div>
  )
})
