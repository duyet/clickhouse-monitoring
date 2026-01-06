'use client'

import { memo } from 'react'
import { chartCard } from '@/components/charts/chart-card-styles'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
  title?: string
}

/**
 * Chart skeleton that matches actual chart dimensions
 * - Matches DynamicChart: min-h-[140px] max-h-[240px]
 * - Matches ChartCard styling: gap-2, py-2, border-border/50
 */
export const ChartSkeleton = memo(function ChartSkeleton({
  className,
  title,
}: ChartSkeletonProps = {}) {
  return (
    <Card
      className={cn(
        chartCard.base,
        chartCard.variants.default,
        'min-h-[140px] max-h-[240px]',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <CardHeader className={chartCard.header}>
        <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase py-2">
          {title ? title + ' (loading ...)' : <Skeleton className="h-3 w-32" />}
        </CardDescription>
      </CardHeader>

      <CardContent className={chartCard.content}>
        <Skeleton className="h-full w-full rounded-md" />
      </CardContent>
    </Card>
  )
})
