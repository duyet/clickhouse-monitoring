'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  color: string
  compact?: boolean
}

export function Sparkline({
  data,
  color,
  compact = false,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })

    // Create smooth curve using cubic bezier
    const pathD = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point}`

      const prev = points[i - 1].split(',')
      const curr = point.split(',')

      const [x0, y0] = prev.map(Number)
      const [x1, y1] = curr.map(Number)

      const cp1x = x0 + (x1 - x0) * 0.5
      const cp1y = y0
      const cp2x = x1 - (x1 - x0) * 0.5
      const cp2y = y1

      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`
    }, '')

    return pathD
  }, [data])

  if (data.length < 2) return null

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('w-full overflow-visible', compact ? 'h-8' : 'h-10')}
    >
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.8"
        vectorEffect="non-scaling-stroke"
      />

      {/* End dot */}
      <circle
        cx="100"
        cy={100 - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * 100}
        r="3"
        fill={color}
        opacity="0.9"
      />
    </svg>
  )
}
