'use client'

import type { NumberChartProps } from '@/types/charts'

import { memo } from 'react'
import { cn } from '@/lib/utils'

export const NumberChart = memo(function NumberChart({
  data,
  nameKey,
  dataKey,
  title,
  description,
  showLabel = false,
  className,
}: NumberChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          'text-muted-foreground p-6 text-center text-xs',
          className
        )}
      >
        No data
      </div>
    )
  }

  const chartData = data[0]

  return (
    <div className={cn(className)}>
      {title || description ? (
        <header className="flex flex-col space-y-1.5 p-4 pb-0">
          <h3 className="text-2xl leading-none font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </header>
      ) : null}
      <div
        className={cn(
          'flex items-baseline gap-1 p-6',
          title || description ? 'flex-row' : 'flex-col'
        )}
      >
        <div className="text-center text-3xl font-bold tabular-nums">
          {chartData[dataKey] || ''}
        </div>
        {showLabel && (
          <div className="text-muted-foreground text-center text-xs">
            {chartData[nameKey] || ''}
          </div>
        )}
      </div>
    </div>
  )
})
