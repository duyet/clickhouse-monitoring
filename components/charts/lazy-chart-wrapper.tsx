'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyChartWrapperProps {
  children: React.ReactNode
  className?: string
  rootMargin?: string
}

/**
 * LazyChartWrapper - Defers chart rendering until scrolled into view.
 *
 * Uses IntersectionObserver to detect when the placeholder enters the viewport.
 * Once visible, renders the chart and disconnects the observer (one-shot).
 *
 * rootMargin='200px' starts loading 200px before the chart becomes visible,
 * giving the data fetch time to complete before the user reaches the chart.
 */
export const LazyChartWrapper = memo(function LazyChartWrapper({
  children,
  className,
  rootMargin = '200px',
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

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <Skeleton className="h-80 w-full rounded-xl" />}
    </div>
  )
})
