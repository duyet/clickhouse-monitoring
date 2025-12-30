'use client'

import { type ReactNode, useEffect, useState, useId, memo, useCallback, useRef } from 'react'
import { ChartSkeleton } from '@/components/skeleton'
import { FadeIn } from '@/components/ui/fade-in'

interface ProgressiveLoaderProps {
  children: ReactNode
  delay?: number // Delay in milliseconds before showing content
  index?: number // Optional index for automatic staggered delays
  stagger?: number // Stagger delay per index (default 100ms)
  fallback?: ReactNode
  className?: string
  /** Priority level: 'high' = no delay, 'normal' = calculated delay, 'low' = extra delay */
  priority?: 'high' | 'normal' | 'low'
}

/**
 * ProgressiveLoader - Staggers rendering of content for better perceived performance
 *
 * Usage:
 * - With manual delay: <ProgressiveLoader delay={200}>{content}</ProgressiveLoader>
 * - With auto-stagger: <ProgressiveLoader index={0}>{chart1}</ProgressiveLoader>
 *                        <ProgressiveLoader index={1}>{chart2}</ProgressiveLoader>
 * - With priority: <ProgressiveLoader index={0} priority="high">{criticalContent}</ProgressiveLoader>
 *
 * The component will:
 * 1. Show skeleton immediately
 * 2. Wait for delay (manual or calculated from index)
 * 3. Render actual content after delay with fade-in
 */
export function ProgressiveLoader({
  children,
  delay,
  index,
  stagger = 80,
  fallback = <ChartSkeleton />,
  className,
  priority = 'normal',
}: ProgressiveLoaderProps) {
  const [shouldShow, setShouldShow] = useState(priority === 'high')
  const id = useId()

  // Calculate actual delay based on priority
  const getDelay = useCallback(() => {
    if (priority === 'high') return 0
    if (delay !== undefined) return delay
    const baseDelay = (index ?? 0) * stagger
    return priority === 'low' ? baseDelay + 200 : baseDelay
  }, [priority, delay, index, stagger])

  useEffect(() => {
    if (priority === 'high') return

    const actualDelay = getDelay()
    const timer = setTimeout(() => {
      setShouldShow(true)
    }, actualDelay)

    return () => clearTimeout(timer)
  }, [getDelay, priority, id])

  if (!shouldShow) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <FadeIn duration={200} className={className}>
      {children}
    </FadeIn>
  )
}

/**
 * ProgressiveGrid - Wraps a grid of items with progressive loading
 */
interface ProgressiveGridProps {
  children: ReactNode
  stagger?: number // Delay between each item (default 100ms)
  className?: string
  fallback?: ReactNode
  batchSize?: number // Number of items to load at once (default 1)
}

export function ProgressiveGrid({
  children,
  stagger = 100,
  className,
  fallback = <ChartSkeleton />,
  batchSize = 1,
}: ProgressiveGridProps) {
  // Get all children and add progressive loading
  const childArray = Array.isArray(children) ? children : [children]

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        // Calculate which batch this item belongs to
        const batchIndex = Math.floor(index / batchSize)
        const delay = batchIndex * stagger

        return (
          <ProgressiveLoader
            key={index}
            delay={delay}
            fallback={fallback}
          >
            {child}
          </ProgressiveLoader>
        )
      })}
    </div>
  )
}

/**
 * useStaggeredLoad - Hook for progressive data fetching
 * Returns true after the specified delay, useful for staggering SWR requests
 */
export function useStaggeredLoad(
  index: number,
  stagger = 100
): boolean {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, index * stagger)

    return () => clearTimeout(timer)
  }, [index, stagger])

  return shouldLoad
}

/**
 * StaggeredChart - Wraps a chart and only fetches data after its delay
 * Use this to progressively load charts without delaying initial render
 *
 * Shows skeleton until delay expires, then renders children (triggering SWR fetch)
 */
interface StaggeredChartProps {
  children: ReactNode
  index: number
  stagger?: number
  className?: string
  skeleton?: ReactNode
  /** Priority: 'high' renders immediately, 'normal' uses stagger, 'low' adds extra delay */
  priority?: 'high' | 'normal' | 'low'
  /** ARIA label for accessibility */
  'aria-label'?: string
}

export const StaggeredChart = memo(function StaggeredChart({
  children,
  index,
  stagger = 80,
  className,
  skeleton,
  priority = 'normal',
  'aria-label': ariaLabel,
}: StaggeredChartProps) {
  const shouldShow = useStaggeredLoad(
    priority === 'high' ? 0 : priority === 'low' ? index + 3 : index,
    stagger
  )

  if (!shouldShow) {
    return (
      <div role="status" aria-label={ariaLabel || 'Loading chart'} aria-busy="true">
        {skeleton ?? <ChartSkeleton />}
      </div>
    )
  }

  return (
    <FadeIn duration={200} className={className}>
      <div aria-label={ariaLabel} role="figure">
        {children}
      </div>
    </FadeIn>
  )
})
