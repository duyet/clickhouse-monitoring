'use client'

import { cn } from '@/lib/utils'
import { NumberChartProps } from '@/types/charts'

export function NumberChart({
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
          'p-6 text-center text-xs text-muted-foreground',
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
          <h3
            className="text-2xl font-semibold leading-none tracking-tight"
            role="title"
          >
            {title}
          </h3>
          <p className="text-sm text-muted-foreground" role="description">
            {description}
          </p>
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
          <div className="text-center text-xs text-muted-foreground">
            {chartData[nameKey] || ''}
          </div>
        )}
      </div>
    </div>
  )
}
