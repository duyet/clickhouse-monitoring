'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
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
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full gap-2 shadow-none py-2',
        'min-h-[140px] max-h-[240px]',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <CardHeader className="px-3 shrink-0">
        <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
          {title || <Skeleton className="h-3 w-32" />}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-1 min-h-0">
        <Skeleton className="h-full w-full rounded-md" />
      </CardContent>
    </Card>
  )
})
