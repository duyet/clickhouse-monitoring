'use client'

import { memo, useId } from 'react'
import { cn } from '@/lib/utils'

interface MetricSparklineProps {
  /** Ordered values, oldest first. Needs at least 2 points to draw. */
  values: number[]
  /** Rendered height in px. Width is fluid (fills the parent). */
  height?: number
  /** Extra classes for the wrapper; set the text color here (drives the
   *  line + gradient via `currentColor`). */
  className?: string
}

/**
 * A dependency-free SVG sparkline.
 *
 * The path is laid out in a unitless 100×100 viewBox and stretched with
 * `preserveAspectRatio="none"`, so it fills any container width without a
 * ResizeObserver. `vectorEffect="non-scaling-stroke"` keeps the 1.5px line
 * crisp despite the non-uniform scale. The latest sample gets a pulsing dot
 * so the chart reads as "live".
 */
export const MetricSparkline = memo(function MetricSparkline({
  values,
  height = 28,
  className,
}: MetricSparklineProps) {
  const gradientId = useId()

  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  // Keep the curve off the very top/bottom edges of the viewBox.
  const pad = 12
  const span = 100 - pad * 2

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = 100 - pad - ((value - min) / range) * span
    return [x, y] as const
  })

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
  const area = `${line} L100,100 L0,100 Z`

  // Latest point — positioned as a percentage so the dot tracks the curve
  // regardless of the stretched aspect ratio.
  const lastValue = values[values.length - 1]
  const lastTopPct = pad + (1 - (lastValue - min) / range) * span

  return (
    <div
      className={cn('relative', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute right-0 flex size-2 -translate-y-1/2"
        style={{ top: `${lastTopPct}%` }}
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
    </div>
  )
})
