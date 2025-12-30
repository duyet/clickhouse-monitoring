'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
  chartClassName?: string
  title?: string
  /** Type of chart for more realistic skeleton */
  type?: 'area' | 'bar' | 'line' | 'metric' | 'table'
  /** Number of data points to show in x-axis */
  dataPoints?: number
}

/**
 * Advanced chart skeleton with SVG variants
 * Supports multiple chart types with realistic loading states
 * Uses animate-pulse for consistent animation with other skeletons
 */
export const ChartSkeleton = memo(function ChartSkeleton({
  className,
  chartClassName,
  title,
  type = 'area',
  dataPoints = 8,
}: ChartSkeletonProps = {}) {
  return (
    <Card
      className={cn('rounded-md', className)}
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex flex-row items-center justify-between">
          {title ? (
            <span className="text-sm text-muted-foreground">{title}</span>
          ) : (
            <Skeleton className="h-4 w-40" />
          )}
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className={cn('relative', chartClassName)}>
          {/* Y-Axis */}
          <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`y-${i}`} className="h-3 w-full" />
            ))}
          </div>

          {/* Chart Area */}
          <div className="ml-10 mb-8">
            {type === 'metric' ? (
              <MetricChartSkeleton />
            ) : type === 'bar' ? (
              <BarChartSkeleton dataPoints={dataPoints} />
            ) : type === 'table' ? (
              <TableChartSkeleton dataPoints={dataPoints} />
            ) : (
              <AreaChartSkeleton dataPoints={dataPoints} />
            )}
          </div>

          {/* X-Axis */}
          <div className="absolute left-10 right-0 bottom-0 h-6 flex items-center justify-between">
            {Array.from({ length: dataPoints }).map((_, i) => (
              <Skeleton key={`x-${i}`} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

/**
 * Area/Line chart skeleton with simple placeholder
 * Height matches page-layout.tsx chartClassName (h-32 sm:h-36)
 */
const AreaChartSkeleton = memo(function AreaChartSkeleton({
  dataPoints: _dataPoints = 8,
}: {
  dataPoints: number
}) {
  return (
    <div className="relative h-32 w-full overflow-hidden sm:h-36">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`grid-${i}`} className="h-px w-full opacity-50" />
        ))}
      </div>

      {/* Simple area placeholder */}
      <div className="absolute inset-x-0 bottom-0 h-1/2">
        <Skeleton className="h-full w-full rounded-t-lg" />
      </div>
    </div>
  )
})

/**
 * Bar chart skeleton with bars
 */
const BarChartSkeleton = memo(function BarChartSkeleton({
  dataPoints = 8,
}: {
  dataPoints: number
}) {
  // Deterministic bar heights based on index (avoids React issues with Math.random())
  const getBarHeight = (index: number) => {
    const heights = [75, 45, 90, 60, 80, 50, 85, 65, 70, 55]
    return heights[index % heights.length]
  }

  return (
    <div className="relative h-32 w-full sm:h-36">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-30">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`grid-${i}`} className="h-px w-full" />
        ))}
      </div>

      {/* Bars */}
      <div className="absolute inset-0 flex items-end justify-around px-2 pb-6">
        {Array.from({ length: dataPoints }).map((_, i) => (
          <Skeleton
            key={`bar-${i}`}
            className="w-full max-w-[30px] rounded-t"
            style={{ height: `${getBarHeight(i)}%` }}
          />
        ))}
      </div>
    </div>
  )
})

/**
 * Metric card skeleton (big number with label)
 */
const MetricChartSkeleton = memo(function MetricChartSkeleton() {
  return (
    <div className="flex h-32 w-full flex-col items-center justify-center gap-3 sm:h-36">
      {/* Big metric value */}
      <Skeleton className="h-16 w-32" />
      {/* Label */}
      <Skeleton className="h-4 w-24" />
      {/* Trend indicator */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
})

/**
 * Table chart skeleton (summary table rows)
 */
const TableChartSkeleton = memo(function TableChartSkeleton({
  dataPoints = 5,
}: {
  dataPoints: number
}) {
  return (
    <div className="h-32 w-full overflow-hidden sm:h-36">
      {/* Table header */}
      <div className="flex items-center gap-2 border-b pb-2 mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Table rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: Math.min(dataPoints, 5) }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
})
