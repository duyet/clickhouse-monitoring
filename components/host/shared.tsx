/**
 * Shared UI components for host-related features
 */

'use client'

import type { HTMLAttributes } from 'react'

interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  title?: string[]
}

/**
 * Generic status indicator dot component
 *
 * Used across host components for consistent status display.
 */
export function StatusIndicator({ className = '', title, ...props }: StatusIndicatorProps) {
  return (
    <span
      className={`flex-none size-2 rounded-full bg-red-400 ${className}`}
      title={title?.join(' - ')}
      {...props}
    />
  )
}
