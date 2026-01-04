'use client'

import type { MetricCardSkeletonProps } from './types'

import { THEME_CONFIGS } from './themes'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function MetricCardSkeleton({
  title,
  description,
  icon,
  theme = 'default',
  variant = 'single',
  compact = false,
  className,
}: MetricCardSkeletonProps) {
  const themeConfig = THEME_CONFIGS[theme]

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br shadow-none py-2',
        themeConfig.gradient,
        className
      )}
      aria-label={`Loading ${title || 'metric'}`}
    >
      <div className="relative">
        <CardHeader
          className={cn(
            'px-2.5 sm:px-3',
            compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
          )}
        >
          <div className="flex items-center gap-1.5">
            {icon ? (
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-md',
                  compact ? 'p-0.5' : 'p-1',
                  themeConfig.bgColor,
                  themeConfig.iconColor,
                  'animate-pulse'
                )}
              >
                {icon}
              </div>
            ) : (
              <Skeleton
                className={cn('rounded-md', compact ? 'size-5' : 'size-8')}
              />
            )}
            <div className="flex-1 space-y-0.5">
              {title ? (
                <CardTitle
                  className={cn(
                    'font-semibold tracking-tight',
                    compact ? 'text-xs' : 'text-sm'
                  )}
                >
                  {title}
                </CardTitle>
              ) : (
                <Skeleton className={cn(compact ? 'h-3' : 'h-4', 'w-24')} />
              )}
              {description ? (
                <CardDescription
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {description}
                </CardDescription>
              ) : (
                <Skeleton className={cn(compact ? 'h-2.5' : 'h-3', 'w-16')} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn('px-2.5 pt-0 sm:px-3', compact ? 'pb-1' : 'pb-1.5')}
        >
          {variant === 'dual' || variant === 'list' ? (
            <div className={cn('space-y-1', compact && 'space-y-0.5')}>
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
            </div>
          ) : variant === 'trend' ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
              <Skeleton className={cn(compact ? 'h-2.5' : 'h-4', 'w-12')} />
            </div>
          ) : (
            <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
          )}
        </CardContent>
      </div>
      <span className="sr-only">Loading {title || 'metric'} data...</span>
    </Card>
  )
}
