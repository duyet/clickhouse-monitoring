/**
 * Daily Insights Component
 *
 * Displays AI-generated insights about ClickHouse cluster health,
 * query performance, and optimization recommendations.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Component Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * DailyInsights
 * ├── Card (shadcn/ui)
 * │   ├── CardHeader (title, period selector, refresh)
 * │   ├── CardContent (insights list)
 * │   │   ├── InsightItem (severity badge, description, recommendation)
 * │   │   └── QuickStats (health score, queries, merges)
 * │   └── CardFooter (last updated, link to details)
 *
 * Data Flow:
 * 1. Component mounts → fetch insights via SWR
 * 2. Display summary stats and top insights
 * 3. Auto-refresh every 5 minutes
 * 4. Manual refresh via button
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import type { VariantProps } from 'class-variance-authority'
import {
  Loader2Icon,
  MinusIcon,
  RefreshCwIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'
import useSWR from 'swr'

import { Suspense, useState } from 'react'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

/** Insight severity levels */
type Severity = 'info' | 'warning' | 'critical'

/** Trend direction */
type Trend = 'up' | 'down' | 'stable'

/** Single insight from API */
interface Insight {
  readonly category: string
  readonly severity: Severity
  readonly title: string
  readonly description: string
  readonly metric?: string | number
  readonly trend?: Trend
  readonly recommendation?: string
}

/** Quick stats summary */
interface QuickStats {
  readonly healthScore?: number
  readonly totalQueries?: number
  readonly avgDuration?: number
  readonly activeMerges?: number
  readonly diskUsage?: number
}

/** Insights API response */
interface InsightsResponse {
  readonly period: string
  readonly timestamp: number
  readonly quickStats?: QuickStats
  readonly insights: readonly Insight[]
  readonly summary: {
    readonly critical: number
    readonly warning: number
    readonly info: number
  }
}

/** Period options */
const PERIOD_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
] as const

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

/** Severity badge variants */
const SEVERITY_VARIANTS: Record<Severity, BadgeVariant> = {
  critical: 'destructive',
  warning: 'default',
  info: 'secondary',
}

/** Severity icons */
const SEVERITY_ICONS: Record<Severity, React.ReactNode> = {
  critical: '🔴',
  warning: '🟡',
  info: 'ℹ️',
}

/** Trend icons */
const TrendIcon = ({ trend }: { readonly trend: Trend }) => {
  if (trend === 'up') return <TrendingUpIcon className="h-3 w-3 text-red-500" />
  if (trend === 'down')
    return <TrendingDownIcon className="h-3 w-3 text-green-500" />
  return <MinusIcon className="h-3 w-3 text-muted-foreground" />
}

function InsightsSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </Card>
  )
}

function InsightItem({ insight }: { readonly insight: Insight }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Severity icon */}
      <span className="text-lg shrink-0">
        {SEVERITY_ICONS[insight.severity]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: title + badge + trend */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="font-medium text-sm">{insight.title}</h4>
          <Badge
            variant={SEVERITY_VARIANTS[insight.severity]}
            className="text-xs"
          >
            {insight.severity}
          </Badge>
          {insight.trend && <TrendIcon trend={insight.trend} />}
          {insight.metric !== undefined && (
            <span className="text-xs text-muted-foreground">
              {insight.metric}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-2">
          {insight.description}
        </p>

        {/* Recommendation */}
        {insight.recommendation && (
          <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
            💡 {insight.recommendation}
          </p>
        )}
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon,
}: {
  readonly label: string
  readonly value: string | number
  readonly icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/20">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

function QuickStatsCard({ stats }: { readonly stats: QuickStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <QuickStat
        label="Health Score"
        value={`${stats.healthScore ?? '--'}/100`}
        icon={<SparklesIcon className="h-3 w-3" />}
      />
      <QuickStat
        label="Queries"
        value={stats.totalQueries?.toLocaleString() ?? '--'}
        icon={<TrendingUpIcon className="h-3 w-3" />}
      />
      <QuickStat
        label="Avg Duration"
        value={`${stats.avgDuration?.toFixed(0) ?? '--'}ms`}
        icon={<MinusIcon className="h-3 w-3" />}
      />
      <QuickStat
        label="Active Merges"
        value={stats.activeMerges ?? '--'}
        icon={<RefreshCwIcon className="h-3 w-3" />}
      />
    </div>
  )
}

export interface DailyInsightsProps {
  readonly hostId?: number
  readonly className?: string
}

export function DailyInsights({
  hostId: propHostId,
  className,
}: DailyInsightsProps) {
  const resolvedHostId = useHostId()
  const hostId = propHostId ?? resolvedHostId
  const [period, setPeriod] = useState('24h')

  // Fetch insights from API
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<InsightsResponse>(
      [`/api/v1/insights`, hostId, period],
      async ([url]) => {
        const response = await fetch(`${url}?hostId=${hostId}&period=${period}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch insights: ${response.statusText}`)
        }
        return response.json()
      },
      {
        refreshInterval: 300000, // 5 minutes
        revalidateOnFocus: false,
      }
    )

  const hasInsights = data && data.insights.length > 0

  return (
    <Card className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <div>
            <h2 className="font-semibold">AI Insights</h2>
            {data && (
              <p className="text-xs text-muted-foreground">
                {data.summary.critical > 0 && (
                  <span className="text-destructive">
                    {data.summary.critical} critical
                  </span>
                )}
                {data.summary.warning > 0 && (
                  <span className="text-yellow-600 dark:text-yellow-500 ml-2">
                    {data.summary.warning} warnings
                  </span>
                )}
                {data.summary.critical === 0 &&
                  data.summary.warning === 0 &&
                  data.summary.info > 0 && (
                    <span className="text-muted-foreground">
                      {data.summary.info} insights
                    </span>
                  )}
              </p>
            )}
          </div>
        </div>

        {/* Period selector + refresh */}
        <div className="flex items-center gap-2">
          {/* Period buttons */}
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-colors',
                  period === option.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutate()}
            disabled={isValidating}
            className="h-8"
          >
            <RefreshCwIcon
              className={cn('h-4 w-4', isValidating && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <SparklesIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Unable to load insights
            </p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Try Again
            </Button>
          </div>
        ) : !hasInsights ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <SparklesIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No insights available for this time period.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different time range or check back later.
            </p>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            {data.quickStats && <QuickStatsCard stats={data.quickStats} />}

            {/* Insights list */}
            <div className="space-y-2">
              {data.insights.map((insight, index) => (
                <InsightItem
                  key={`${insight.category}-${index}`}
                  insight={insight}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Last updated: {new Date(data.timestamp).toLocaleTimeString()}
              </span>
              <span>{data.period} analysis period</span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export function DailyInsightsWithSuspense(props: DailyInsightsProps) {
  return (
    <Suspense fallback={<InsightsSkeleton />}>
      <DailyInsights {...props} />
    </Suspense>
  )
}
