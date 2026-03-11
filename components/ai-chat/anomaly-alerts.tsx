/**
 * Anomaly Alerts Panel Component
 *
 * Displays detected anomalies with severity levels and actionable recommendations.
 * Integrates with the anomaly detection system to show real-time alerts.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Component Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * AnomalyAlertsPanel
 * ├── AnomalyAlert (individual alert card)
 * │   ├── SeverityBadge (color-coded severity)
 * │   ├── AlertTitle
 * │   ├── AlertDescription
 * │   ├── MetricsComparison (current vs baseline)
 * │   └── RecommendedAction
 * └── EmptyState (no anomalies)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import {
  ActivityIcon,
  AlertTriangleIcon,
  BanIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CpuIcon,
  DatabaseIcon,
  DiscIcon,
  RefreshCwIcon,
  XCircleIcon,
} from 'lucide-react'

import type { Anomaly } from '@/lib/agents/tools/baseline-analyzer'

import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

/** Anomaly severity type */
type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

/** Extended anomaly with UI state */
interface AnomalyWithUI extends Anomaly {
  readonly expanded?: boolean
}

/**
 * API response for anomaly detection
 */
interface AnomalyDetectionResponse {
  readonly anomalies: readonly Anomaly[]
  readonly metadata: {
    readonly timeRange: string
    readonly dataPoints: number
    readonly analysisDuration: number
  }
}

/** Props for AnomalyAlertsPanel */
interface AnomalyAlertsPanelProps {
  /** Host identifier (uses context if not provided) */
  readonly hostId?: number
  /** Optional class name */
  readonly className?: string
  /** Whether to auto-refresh */
  readonly autoRefresh?: boolean
  /** Refresh interval in milliseconds */
  readonly refreshInterval?: number
}

/** Empty state component */
function EmptyAnomaliesState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <CheckCircle2Icon className="h-12 w-12 text-green-500 mb-3" />
      <h3 className="text-lg font-semibold mb-1">All Systems Normal</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        No anomalies detected in the last 24 hours. All metrics are within
        expected ranges.
      </p>
    </div>
  )
}

/** Loading state component */
function AnomaliesLoadingState() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Severity badge component */
function SeverityBadge({ severity }: { readonly severity: AnomalySeverity }) {
  const variants: Record<
    AnomalySeverity,
    {
      readonly bg: string
      readonly text: string
      readonly icon: typeof BanIcon
    }
  > = {
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      icon: BanIcon,
    },
    high: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      icon: AlertTriangleIcon,
    },
    medium: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-300',
      icon: AlertTriangleIcon,
    },
    low: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      icon: ActivityIcon,
    },
  }

  const variant = variants[severity]
  const Icon = variant.icon

  return (
    <Badge className={cn('gap-1', variant.bg, variant.text)}>
      <Icon className="h-3 w-3" />
      {severity.toUpperCase()}
    </Badge>
  )
}

/** Anomaly type icon */
function AnomalyTypeIcon({ type }: { readonly type: Anomaly['type'] }) {
  const icons: Record<Anomaly['type'], typeof ActivityIcon> = {
    query_spike: ActivityIcon,
    memory_anomaly: CpuIcon,
    merge_delay: DatabaseIcon,
    replication_lag: RefreshCwIcon,
    disk_change: DiscIcon,
    error_rate: XCircleIcon,
  }

  const Icon = icons[type] ?? ActivityIcon
  return <Icon className="h-4 w-4" />
}

/** Individual alert card */
function AnomalyAlert({
  anomaly,
  isExpanded,
  onToggle,
}: {
  readonly anomaly: AnomalyWithUI
  readonly isExpanded: boolean
  readonly onToggle: () => void
}) {
  const severityColors: Record<AnomalySeverity, string> = {
    critical:
      'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10',
    high: 'border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/10',
    medium:
      'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10',
    low: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/10',
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        severityColors[anomaly.severity]
      )}
    >
      {/* Alert Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <AnomalyTypeIcon type={anomaly.type} />
            <h4 className="font-semibold text-sm">{anomaly.title}</h4>
            <SeverityBadge severity={anomaly.severity} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {anomaly.description}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-semibold text-destructive">
            +{anomaly.deviation.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">vs baseline</div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-black/5 dark:border-white/5">
          {/* Metrics Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Current Value</div>
              <div className="text-lg font-semibold tabular-nums">
                {anomaly.currentValue.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Baseline</div>
              <div className="text-lg font-semibold tabular-nums text-muted-foreground">
                {anomaly.baselineValue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Recommended Action
            </div>
            <p className="text-sm">{anomaly.recommendedAction}</p>
          </div>

          {/* Investigation Query */}
          {anomaly.investigationQuery && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                Investigation Query
              </div>
              <code className="block text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {anomaly.investigationQuery}
              </code>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            Detected {new Date(anomaly.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </Card>
  )
}

/** Main panel component */
export function AnomalyAlertsPanel({
  hostId: propHostId,
  className,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
}: AnomalyAlertsPanelProps) {
  const resolvedHostId = useHostId()
  const hostId = propHostId ?? resolvedHostId

  const [anomalies, setAnomalies] = useState<readonly AnomalyWithUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchAnomalies = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/anomalies?hostId=${hostId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as AnomalyDetectionResponse

      startTransition(() => {
        setAnomalies(data.anomalies as AnomalyWithUI[])
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch anomalies'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchAnomalies is stable and only depends on hostId
  useEffect(() => {
    fetchAnomalies()
  }, [hostId])

  // Auto-refresh
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchAnomalies is stable and only depends on hostId
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(fetchAnomalies, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, hostId])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const severityCounts = anomalies.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1
      return acc
    },
    {} as Record<AnomalySeverity, number>
  )

  return (
    <Card className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold">Anomaly Detection</h2>
          <span className="text-xs text-muted-foreground">Host {hostId}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Counts */}
          {Object.entries(severityCounts).map(([severity, count]) =>
            count > 0 ? (
              <Badge
                key={severity}
                variant="outline"
                className={cn(
                  'text-xs',
                  severity === 'critical' &&
                    'border-red-500 text-red-700 dark:text-red-400',
                  severity === 'high' &&
                    'border-orange-500 text-orange-700 dark:text-orange-400'
                )}
              >
                {severity}: {count}
              </Badge>
            ) : null
          )}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAnomalies}
            disabled={isLoading || isPending}
            className="h-8"
          >
            <RefreshCwIcon
              className={cn(
                'h-4 w-4',
                isLoading || isPending ? 'animate-spin' : ''
              )}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <AnomaliesLoadingState />
        ) : error ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>{error}</p>
            <Button
              variant="link"
              size="sm"
              onClick={fetchAnomalies}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : anomalies.length === 0 ? (
          <EmptyAnomaliesState />
        ) : (
          <div className="p-4 space-y-3">
            {anomalies.map((anomaly) => (
              <AnomalyAlert
                key={anomaly.id}
                anomaly={anomaly}
                isExpanded={expandedIds.has(anomaly.id)}
                onToggle={() => toggleExpanded(anomaly.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      {!isLoading && !error && anomalies.length > 0 && (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Last checked: {new Date().toLocaleTimeString()}</span>
          <span>
            {anomalies.length} anomaly{anomalies.length !== 1 ? 'ies' : ''}{' '}
            detected
          </span>
        </div>
      )}
    </Card>
  )
}

/** Suspense wrapper for lazy loading */
export function AnomalyAlertsPanelWithSuspense(props: AnomalyAlertsPanelProps) {
  return <AnomalyAlertsPanel {...props} />
}
