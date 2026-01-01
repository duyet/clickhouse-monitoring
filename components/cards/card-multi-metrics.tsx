'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

export interface CardMultiMetricsProps {
  primary?: string | number | React.ReactNode
  items?: {
    current: number
    target: number
    currentReadable?: string
    targetReadable?: string
    label?: string
  }[]
  currentLabel?: string
  targetLabel?: string
  className?: string
}

const DottedLineProgress = memo(function DottedLineProgress({
  percent,
  className,
}: {
  percent: number
  className?: string
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('relative flex-1 h-3 min-w-8', className)}>
      {/* Background dotted line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dotted border-muted-foreground/20" />
      </div>
      {/* Foreground filled dotted line */}
      <div
        className="absolute inset-0 flex items-center overflow-hidden"
        style={{ width: `${clampedPercent}%` }}
      >
        <div className="w-full border-t border-dotted border-primary" />
      </div>
    </div>
  )
})

export const CardMultiMetrics = memo(function CardMultiMetrics({
  primary,
  items = [],
  className,
}: CardMultiMetricsProps) {
  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      aria-description="card-metrics"
    >
      {primary && (
        <div className="text-xl font-semibold leading-tight">{primary}</div>
      )}

      <div className="flex flex-col gap-2.5 overflow-hidden">
        {items.map((item, i) => {
          const percent =
            item.target > 0 ? (item.current / item.target) * 100 : 0
          const clampedPercent = Math.min(100, Math.max(0, percent))

          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground truncate flex-1 min-w-0">
                {item.currentReadable}
              </span>
              <DottedLineProgress
                percent={clampedPercent}
                className="shrink-0"
              />
              <span className="font-medium truncate flex-1 min-w-0 text-right">
                {item.targetReadable}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
