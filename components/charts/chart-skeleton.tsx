'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
  chartClassName?: string
  title?: string
}

export function ChartSkeleton({
  className,
  chartClassName,
  title,
}: ChartSkeletonProps) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHeader className="p-2">
        <div className="flex flex-row items-center justify-between">
          {title ? (
            <span className="text-sm text-muted-foreground">{title}</span>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <Skeleton className={cn('h-52 w-full rounded-md', chartClassName)} />
      </CardContent>
    </Card>
  )
}
