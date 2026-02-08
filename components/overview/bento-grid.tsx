'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type BentoSize = 'small' | 'medium' | 'large' | 'wide' | 'tall'

export interface BentoItemProps {
  children: ReactNode
  size?: BentoSize
  className?: string
}

// ============================================================================
// BentoItem Component
// ============================================================================

/**
 * BentoItem - A single item in the bento grid with divider lines
 * Following Vercel dashboard pattern: no card borders, use dividers between cells
 */
export const BentoItem = memo(function BentoItem({
  children,
  size = 'small',
  className,
}: BentoItemProps) {
  const sizeClasses: Record<BentoSize, string> = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 row-span-1 md:col-span-2 md:row-span-1',
    large: 'col-span-1 row-span-1 md:col-span-2 md:row-span-2',
    wide: 'col-span-1 row-span-1 md:col-span-2 lg:col-span-3',
    tall: 'col-span-1 row-span-1 md:col-span-1 md:row-span-2',
  }

  return (
    <div
      className={cn(
        // Grid positioning
        sizeClasses[size],
        // Divider lines following Vercel pattern
        'border-b border-border/50 last:border-b-0',
        'md:border-r md:last:border-r-0',
        // Padding for content
        'p-3',
        className
      )}
    >
      {children}
    </div>
  )
})

// ============================================================================
// BentoGrid Component
// ============================================================================

export interface BentoGridProps {
  children: ReactNode
  className?: string
}

/**
 * BentoGrid - Modern asymmetric grid layout for dashboard widgets
 *
 * Following Vercel dashboard design pattern:
 * - No individual card borders/shadows (avoid box-in-box)
 * - Use border-border/50 divider lines between cells
 * - Lightweight section headers with icon + uppercase title
 * - Dense info display with efficient space usage
 *
 * Responsive behavior:
 * - Mobile (< 768px): Single column stacked with bottom dividers
 * - Tablet (768-1024px): 2 columns with right dividers
 * - Desktop (> 1024px): 4 columns with right and bottom dividers
 *
 * Size variants:
 * - small: 1x1 unit
 * - medium: 2x1 units (spans 2 columns on desktop)
 * - large: 2x2 units (spans 2 columns and 2 rows on desktop)
 * - wide: 3x1 units (spans 3 columns on desktop)
 * - tall: 1x2 units (spans 1 column and 2 rows on desktop)
 */
export const BentoGrid = memo(function BentoGrid({
  children,
  className,
}: BentoGridProps) {
  return (
    <div
      className={cn(
        // Grid container with responsive columns
        'grid gap-0',
        // Mobile: 1 column
        'grid-cols-1',
        // Tablet: 2 columns
        'md:grid-cols-2',
        // Desktop: 4 columns
        'lg:grid-cols-4',
        // Ensure items stretch to fill
        'auto-rows-fr',
        // Outer border following Vercel pattern
        'border border-border/50 rounded-lg overflow-hidden',
        // Background
        'bg-background/[0.3]',
        className
      )}
      role="region"
      aria-label="Bento grid dashboard"
    >
      {children}
    </div>
  )
})
