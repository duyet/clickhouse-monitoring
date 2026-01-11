/**
 * Reusable color indicator for chart tooltips
 *
 * Provides consistent styling for color dots across different chart types.
 */

'use client'

import type { HTMLAttributes } from 'react'

interface TooltipColorIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  colorVar: string
  size?: 'default' | 'small'
}

/**
 * Standard color indicator dot for chart tooltips
 */
export function TooltipColorIndicator({
  colorVar,
  size = 'default',
  className = '',
  style,
  ...props
}: TooltipColorIndicatorProps) {
  const sizeClass = size === 'small' ? 'size-2' : 'size-2.5'

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-[2px] bg-(--color-bg) ${className}`}
      style={
        {
          '--color-bg': colorVar,
          ...style,
        } as Record<string, string>
      }
      {...props}
    />
  )
}
