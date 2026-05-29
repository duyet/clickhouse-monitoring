'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LazyChartWrapperProps {
  children: React.ReactNode
  className?: string
  rootMargin?: string
  /**
   * Reserved height for the slot before the chart loads. Keeps the placeholder
   * from collapsing to 0px on pages without a fixed-height grid, which is what
   * causes every IntersectionObserver to fire at once and the page to jump while
   * scrolling. Accepts any CSS length. Defaults to a single grid-cell height.
   */
  minHeight?: number | string
}

/**
 * LazyChartWrapper - Defers chart rendering until scrolled into view.
 *
 * Uses IntersectionObserver to detect when the placeholder enters the viewport.
 * Once visible, renders the chart and disconnects the observer (one-shot).
 *
 * rootMargin='400px' starts loading well before the chart becomes visible so the
 * data fetch finishes before the user reaches it — this is what keeps a fast
 * scroll-to-bottom smooth instead of swapping skeletons inside the viewport.
 *
 * Scroll stability: the slot reserves its height up front (`minHeight` +
 * `contain-intrinsic-size`) and opts out of browser scroll anchoring
 * (`overflow-anchor: none`). Together these stop the layout shift / scroll-jump
 * "flaking" that happened when charts mounted above the viewport during a scroll.
 */
export const LazyChartWrapper = function LazyChartWrapper({
  children,
  className,
  rootMargin = '400px 0px',
  minHeight = 280,
}: LazyChartWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return // already visible, no need for observer

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, isVisible])

  const minHeightValue =
    typeof minHeight === 'number' ? `${minHeight}px` : minHeight

  return (
    <div
      ref={ref}
      className={cn('overflow-anchor-none', className)}
      style={{
        // Reserve height so the slot never collapses, even outside a
        // fixed-height grid, and so off-screen slots can skip rendering work.
        minHeight: isVisible ? undefined : minHeightValue,
        containIntrinsicSize: isVisible ? undefined : `auto ${minHeightValue}`,
      }}
    >
      {isVisible ? children : <Skeleton className="h-full w-full rounded-xl" />}
    </div>
  )
}
