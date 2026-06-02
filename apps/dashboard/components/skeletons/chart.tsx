'use client'

import { chartCard } from '@/components/charts/chart-card-styles'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type ChartSkeletonType = 'area' | 'bar' | 'line' | 'metric' | 'table'

interface ChartSkeletonProps {
  className?: string
  title?: string
  type?: ChartSkeletonType
}

/** Area/Line chart skeleton using a beautifully simulated SVG wave */
const AreaChartSkeleton = () => (
  <div className="relative w-full h-full min-h-[140px] flex flex-col justify-between pt-4">
    {/* Grid lines */}
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 py-2">
      <div className="border-b border-dashed border-border w-full" />
      <div className="border-b border-dashed border-border w-full" />
      <div className="border-b border-dashed border-border w-full" />
      <div className="w-full" />
    </div>

    {/* Simulated wave SVG with gradient sweep */}
    <div className="relative w-full h-[90px] mt-auto">
      <svg
        className="w-full h-full text-primary/10 dark:text-primary/5"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="area-skeleton-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wave path — explicit Q segments keep every control point inside
            the 0–100 viewBox; a smooth `T` chain reflects control points
            unboundedly and clips the curve at the top edge. */}
        <path
          d="M0,100 L0,68 Q50,22 100,52 Q150,80 200,44 Q250,22 300,58 Q350,82 400,48 L400,100 Z"
          fill="url(#area-skeleton-grad)"
          className="animate-[pulse-subtle_3s_ease-in-out_infinite]"
        />
        {/* Wavy line stroke */}
        <path
          d="M0,68 Q50,22 100,52 Q150,80 200,44 Q250,22 300,58 Q350,82 400,48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-40 animate-[pulse-subtle_3s_ease-in-out_infinite]"
          style={{ animationDelay: '150ms' }}
        />
      </svg>
    </div>

    {/* Bottom X-axis labels mock */}
    <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-1 pt-1 border-t border-border/30">
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
    </div>
  </div>
)

/** Line chart skeleton without filled area */
const LineChartSkeleton = () => (
  <div className="relative w-full h-full min-h-[140px] flex flex-col justify-between pt-4">
    {/* Grid lines */}
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 py-2">
      <div className="border-b border-dashed border-border w-full" />
      <div className="border-b border-dashed border-border w-full" />
      <div className="border-b border-dashed border-border w-full" />
      <div className="w-full" />
    </div>

    {/* Simulated wave SVG with gradient sweep */}
    <div className="relative w-full h-[90px] mt-auto">
      <svg
        className="w-full h-full text-primary/20 dark:text-primary/10"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
      >
        {/* Wavy line stroke — explicit Q segments stay inside the viewBox. */}
        <path
          d="M0,52 Q50,18 100,48 Q150,84 200,40 Q250,18 300,60 Q350,82 400,46"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="animate-[pulse-subtle_3s_ease-in-out_infinite]"
        />
      </svg>
    </div>

    {/* Bottom X-axis labels mock */}
    <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-1 pt-1 border-t border-border/30">
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
      <Skeleton className="h-2 w-8" />
    </div>
  </div>
)

/** Bar chart skeleton with mathematical heights and staggered wave pulse */
const BarChartSkeleton = () => (
  <div className="w-full h-full min-h-[140px] flex flex-col justify-between pt-4">
    {/* Simulated Bars */}
    <div className="flex h-[90px] items-end justify-between gap-3 px-1 mt-auto">
      {[50, 75, 45, 90, 60, 70, 35, 85].map((height, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
        >
          <Skeleton
            variant="shimmer"
            className="w-full rounded-t-[3px] bg-accent/40"
            style={{
              height: `${height}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        </div>
      ))}
    </div>

    {/* Bottom X-axis labels mock */}
    <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-1.5 pt-1 border-t border-border/30">
      <Skeleton className="h-2 w-6" />
      <Skeleton className="h-2 w-6" />
      <Skeleton className="h-2 w-6" />
      <Skeleton className="h-2 w-6" />
    </div>
  </div>
)

/** KPI Metric Card Skeleton with sparkline trend outline */
const MetricCardSkeleton = () => (
  <div className="flex h-full w-full items-center justify-between py-6 px-1 gap-4">
    <div className="space-y-3 flex-1">
      <Skeleton className="h-3 w-2/5 opacity-80" />
      <div className="flex items-baseline gap-1.5">
        <Skeleton variant="shimmer" className="h-9 w-3/5 font-bold" />
        <Skeleton className="h-4 w-1/5 opacity-60" />
      </div>
      <Skeleton className="h-3.5 w-1/2 opacity-70" />
    </div>

    {/* Trend Sparkline line */}
    <div className="w-[30%] h-12 self-end pb-1 opacity-25 dark:opacity-15 text-primary">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 Q17,7 34,16 Q50,25 67,12 Q84,6 100,17"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="animate-[pulse-subtle_2.5s_ease-in-out_infinite]"
        />
      </svg>
    </div>
  </div>
)

/** Tabular skeleton mirroring actual tables */
const TableSkeletonMini = () => (
  <div className="w-full h-full min-h-[140px] flex flex-col pt-1">
    {/* Simulated Table Header */}
    <div className="flex items-center gap-4 border-b border-border/60 pb-2 mb-2 px-1">
      <Skeleton className="h-3 w-1/3 opacity-80" />
      <Skeleton className="h-3 w-1/4 opacity-60" />
      <Skeleton className="h-3 w-1/5 opacity-40 ml-auto" />
    </div>

    {/* Table rows with shimmering effects */}
    <div className="space-y-3 p-1 flex-1">
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton variant="shimmer" className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/5 opacity-80" />
          <Skeleton className="h-3 w-1/6 opacity-60 ml-auto" />
        </div>
      ))}
    </div>
  </div>
)

/**
 * Chart skeleton that matches actual chart dimensions & layouts
 * - Matches DynamicChart: min-h-[140px] max-h-[240px]
 * - Matches ChartCard styling: gap-2, py-2, border-border/50
 * - Supports realistic mock types to prevent Layout Shift
 */
export const ChartSkeleton = function ChartSkeleton({
  className,
  title,
  type = 'area',
}: ChartSkeletonProps = {}) {
  // Render appropriate loader based on type
  const renderContent = () => {
    switch (type) {
      case 'bar':
        return <BarChartSkeleton />
      case 'line':
        return <LineChartSkeleton />
      case 'metric':
        return <MetricCardSkeleton />
      case 'table':
        return <TableSkeletonMini />
      default:
        return <AreaChartSkeleton />
    }
  }

  return (
    <Card
      className={cn(
        chartCard.base,
        chartCard.variants.default,
        'min-h-[160px]',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <CardHeader className={chartCard.header}>
        <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase py-2 flex items-center justify-between">
          {title ? (
            <span className="flex items-center gap-2">
              <span className="truncate max-w-[200px]">{title}</span>
              <span className="text-[10px] text-muted-foreground/40 font-normal lowercase animate-pulse">
                (loading…)
              </span>
            </span>
          ) : (
            <Skeleton className="h-3 w-32" />
          )}
        </CardDescription>
      </CardHeader>

      <CardContent
        className={cn(chartCard.content, 'relative overflow-hidden')}
      >
        {renderContent()}
      </CardContent>
    </Card>
  )
}
