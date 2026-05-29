/**
 * Shared UI components for host-related features
 */

'use client'

import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface StatusIndicatorProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  title?: string[]
}

/**
 * Generic status indicator dot component
 *
 * Used across host components for consistent status display.
 * NOTE: Uses cn() for proper Tailwind class merging - passing a bg-* class
 * will correctly override the default bg-red-400.
 */
export function StatusIndicator({
  className = '',
  title,
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      className={cn('flex-none size-2 rounded-full bg-red-400', className)}
      title={title?.join(' - ')}
      {...props}
    />
  )
}
