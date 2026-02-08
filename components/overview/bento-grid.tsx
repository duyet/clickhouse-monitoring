'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type BentoSize =
  | 'small' // 1 col on mobile, scales up
  | 'medium' // Same as small (kept for compatibility, no row spanning)
  | 'wide' // 1 col on mobile, wider on larger screens
  | 'full' // Full width on all screens

export interface BentoItemProps {
  children: ReactNode
  size?: BentoSize
  className?: string
  /**
   * Whether the item is interactive (contains links or clickable elements).
   * Adds hover state and focus-visible styles for better UX.
   */
  interactive?: boolean
}

// ============================================================================
// BentoItem Component
// ============================================================================

/**
 * BentoItem - A single item in the bento grid with divider lines
 * Following Vercel dashboard pattern: no card borders, use dividers between cells
 *
 * Interactive prop adds hover state and focus-visible styles for cards with links.
 */
export const BentoItem = memo(function BentoItem({
  children,
  size = 'small',
  className,
  interactive = false,
}: BentoItemProps) {
  const sizeClasses: Record<BentoSize, string> = {
    // Small: Scales to fill space better on large screens
    small:
      'col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6 2xl:col-span-6',
    // Medium: Same as small (no row spanning)
    medium:
      'col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6 2xl:col-span-6',
    // Wide: Spans more on larger screens
    wide: 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-8 xl:col-span-16 2xl:col-span-16',
    // Full: Full row width
    full: 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-12 xl:col-span-16 2xl:col-span-20',
  }

  return (
    <div
      className={cn(
        // Grid positioning
        sizeClasses[size],
        // Divider lines following Vercel pattern
        'border-b border-border/40 last:border-b-0',
        'sm:border-r sm:last:border-r-0',
        // Responsive padding: less on mobile, more on larger screens
        'p-2 sm:p-2.5 md:p-3',
        // Consistent minimum height for visual alignment
        'min-h-[180px] sm:min-h-[200px]',
        // Flex column for content distribution
        'flex flex-col',
        // Interactive hover state (subtle, like Vercel dashboard)
        interactive && [
          'hover:bg-muted/30',
          'transition-colors duration-150',
          'focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset',
        ],
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
 * BentoGrid - Full-width responsive bento grid for dashboard widgets
 *
 * Following Vercel Geist design pattern with responsive columns:
 * - No max-width constraint - scales to full viewport width
 * - Grid columns increase with screen size for better space utilization
 * - Geist color tokens (border/foreground/muted)
 * - 4px base unit for spacing
 * - Lightweight section headers
 *
 * Mobile-first responsive behavior:
 * - Base (< 640px): 1 column (stacked, full-width cards)
 * - sm (640px+): 2 columns (2 items per row)
 * - md (768px+): 4 columns (4 items per row)
 * - lg (1024px+): 12 columns (3 items per row)
 * - xl (1280px+): 16 columns (4 items per row)
 * - 2xl (1536px+): 20 columns (5 items per row)
 *
 * Size variants (scales to fill space on large screens):
 * - small: 1→1→2→4→6→6 cols (6 cols on xl/2xl = ~30-40% width)
 * - medium: Same as small
 * - wide: 1→2→4→8→16→16 cols (full row on xl/2xl)
 * - full: 1→2→4→12→16→20 cols (full row on all breakpoints)
 */
export const BentoGrid = memo(function BentoGrid({
  children,
  className,
}: BentoGridProps) {
  return (
    <div
      className={cn(
        // Full width responsive grid
        'w-full grid gap-0',
        // Mobile: 1 column (stacked)
        'grid-cols-1',
        // sm: 2 columns
        'sm:grid-cols-2',
        // md: 4 columns
        'md:grid-cols-4',
        // lg: 12 columns
        'lg:grid-cols-12',
        // xl: 16 columns
        'xl:grid-cols-16',
        // 2xl: 20 columns
        '2xl:grid-cols-20',
        // Ensure items stretch to fill
        'auto-rows-fr',
        // Outer border following Vercel pattern
        'border border-border/40 rounded-lg overflow-hidden',
        // Background (Geist: subtle transparency)
        'bg-background/[0.4]',
        className
      )}
      role="region"
      aria-label="Bento grid dashboard"
    >
      {children}
    </div>
  )
})
