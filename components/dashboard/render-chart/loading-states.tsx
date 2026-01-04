/**
 * Loading and error state components for RenderChart
 */

import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/skeletons'

interface LoadingStateProps {
  title: string
  className?: string
}

interface ErrorStateProps extends LoadingStateProps {
  error: Error
  onRetry: () => void
}

interface EmptyStateProps {
  title: string
}

/**
 * Loading skeleton for chart
 */
export function ChartLoadingState({ title, className }: LoadingStateProps) {
  return <ChartSkeleton title={title} className={className} />
}

/**
 * Error display with retry button
 */
export function ChartErrorState({ error, title, onRetry }: ErrorStateProps) {
  return <ChartError error={error} title={title} onRetry={onRetry} />
}

/**
 * Empty state when event_time column is missing
 */
export function ChartMissingEventTime({ title: _title }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center p-4 text-muted-foreground">
      <code>event_time</code> column is required from query result
    </div>
  )
}

/**
 * Unknown chart kind fallback
 */
export function UnknownChartKind({ kind }: { kind: string }) {
  return (
    <div className="flex items-center justify-center p-4 text-destructive">
      Unknown chart kind: {kind}
    </div>
  )
}
