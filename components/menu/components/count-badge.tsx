/**
 * Count Badge component for menu items
 *
 * Displays a count badge with hover animation that reveals a label.
 * Uses CSS transitions with max-width trick for smooth animation.
 * Uses useHostId hook internally - no prop drilling needed.
 */

'use client'

import type { BadgeVariant } from '@/types/badge-variant'

import { useMenuCount } from '../hooks/use-menu-count'
import { memo } from 'react'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface CountBadgeProps {
  countKey?: string
  countLabel?: string
  countVariant?: BadgeVariant
}

export const CountBadge = memo(function CountBadge({
  countKey,
  countLabel,
  countVariant = 'secondary',
}: CountBadgeProps) {
  const hostId = useHostId()
  const { count, isLoading } = useMenuCount(countKey, hostId)

  // Don't render if loading, no count, or count is 0
  if (isLoading || count === null || count === 0) {
    return null
  }

  const variantClasses =
    countVariant === 'destructive'
      ? 'bg-destructive/15 text-destructive'
      : 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'group/count inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5',
        'text-[10px] font-medium tabular-nums',
        'transition-all duration-200 ease-out',
        'group-data-[state=collapsed]/sidebar:hidden',
        variantClasses
      )}
    >
      <span className="shrink-0">{count}</span>
      {countLabel && (
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap',
            'transition-all duration-200 ease-out',
            'max-w-0 opacity-0',
            'group-hover/count:max-w-20 group-hover/count:opacity-100'
          )}
        >
          {countLabel}
        </span>
      )}
    </span>
  )
})
