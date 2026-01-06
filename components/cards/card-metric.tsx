'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

export interface CardMetricProps {
  current: number
  target: number
  currentReadable?: string
  targetReadable?: string
  className?: string
}

export const CardMetric = memo(function CardMetric({
  current,
  target,
  currentReadable,
  targetReadable,
  className,
}: CardMetricProps) {
  const percent = (current / target) * 100

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="text-xl md:text-3xl">{currentReadable || current}</div>

      <div>
        <div className="mt-2 flex flex-row items-center justify-between gap-2">
          <span
            className="text-muted-foreground truncate"
            title={`${percent}%`}
          >
            {currentReadable || current}
          </span>
          <hr className="shrink grow border-dotted" />
          <span className="text-nowrap">{targetReadable || target}</span>
        </div>
      </div>
    </div>
  )
})
