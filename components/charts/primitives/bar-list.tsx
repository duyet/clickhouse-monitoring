'use client'

import { memo, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface BarListProps {
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  formatedColumn?: string
  className?: string
}

export const BarList = memo(function BarList({
  data,
  formatedColumn,
  className,
}: BarListProps) {
  // Compact number formatter (e.g., 10.98 million -> 10.9M)
  const compactFormat = useCallback((value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toLocaleString()
  }, [])

  const valueFormatter = useMemo(() => {
    if (!formatedColumn) {
      return (value: number) => compactFormat(value)
    }

    return (value: number) => {
      const formatted = data.find((d) => d.value === value)?.[
        formatedColumn
      ] as string
      // Use compact format if string is too long or contains verbose words
      if (
        formatted &&
        (formatted.length > 10 || /million|billion|thousand/i.test(formatted))
      ) {
        return compactFormat(value)
      }
      return formatted || compactFormat(value)
    }
  }, [formatedColumn, data, compactFormat])

  // Sort data by value in descending order
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value)
  }, [data])

  // Find max value for percentage calculation
  const maxValue = useMemo(() => {
    return Math.max(...sortedData.map((d) => d.value), 1)
  }, [sortedData])

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {sortedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100
        // Opacity decreases from 100% to 60% across the bars
        const opacity = Math.round(
          100 - (index / Math.max(sortedData.length - 1, 1)) * 40
        )
        const bgColor = `color-mix(in oklch, var(--chart-1) ${opacity}%, transparent)`

        return (
          <div key={item.name} className="relative h-7 overflow-hidden rounded">
            {/* Colored bar background */}
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${percentage}%`,
                backgroundColor: bgColor,
              }}
            />
            {/* Dark text layer (visible on white background) */}
            <div className="absolute inset-0 flex items-center justify-between">
              <span className="truncate px-2.5 text-sm font-medium text-foreground">
                {item.name}
              </span>
              <span className="shrink-0 px-2.5 font-mono text-sm font-medium tabular-nums text-foreground">
                {valueFormatter(item.value)}
              </span>
            </div>
            {/* White text layer (visible on colored bar) */}
            <div
              className="absolute inset-0 flex items-center justify-between overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
            >
              <span
                className="truncate px-2.5 text-sm font-medium text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
              >
                {item.name}
              </span>
              <span
                className="shrink-0 px-2.5 font-mono text-sm font-medium tabular-nums text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
              >
                {valueFormatter(item.value)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
})
