'use client'

import { Activity, RefreshCw } from 'lucide-react'

import type { RunningQueryRow } from '@/components/running-queries/running-query-card'
import type { CardError } from '@/lib/card-error-utils'

import { memo, useEffect } from 'react'
import { RunningQueryCard } from '@/components/running-queries/running-query-card'
import { Skeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  detectCardErrorVariant,
  getCardErrorDescription,
  getCardErrorTitle,
} from '@/lib/card-error-utils'
import { recordRunningQuerySnapshot } from '@/lib/running-queries/metrics-history'
import { useHostId } from '@/lib/swr/use-host'
import { useTableData } from '@/lib/swr/use-table-data'
import { cn } from '@/lib/utils'

/**
 * Auto-refresh cadence for the running-queries list (ms).
 *
 * Defaults to 5s so the per-card memory sparkline reads as genuinely "live";
 * `system.processes` is an in-memory table, so frequent polling is cheap.
 * Override with `NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS`.
 */
const REFRESH_INTERVAL = (() => {
  const envValue = process.env.NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS
  const parsed = envValue ? Number.parseInt(envValue, 10) : NaN
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : 5_000
})()

/** Skeleton placeholder shown during the initial load. */
function LoadingState() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-3 pt-2.5">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
          <div className="px-3 py-1.5">
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-3 border-t border-border/60 px-3 py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-7 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * RunningQueriesView — compact card-list of in-flight ClickHouse queries.
 *
 * Replaces the generic 17-column data table on the Running Queries page.
 * Each query renders as a dense {@link RunningQueryCard}; the list auto-
 * refreshes on {@link REFRESH_INTERVAL} (5s by default) and surfaces
 * loading / empty / error states inline.
 */
export const RunningQueriesView = memo(function RunningQueriesView() {
  const hostId = useHostId()
  const { data, error, isLoading, isValidating, refresh } =
    useTableData<RunningQueryRow>(
      'running-queries',
      hostId,
      undefined,
      REFRESH_INTERVAL
    )

  // Fold each poll into the rolling metric history that powers the per-card
  // live memory sparkline. Cards append the latest value themselves, so a
  // one-render lag here is invisible.
  useEffect(() => {
    if (data) recordRunningQuerySnapshot(data)
  }, [data])

  // Show the skeleton on first load only — keep stale rows visible while
  // a background refresh is in flight to avoid layout flicker.
  if (isLoading && !data) {
    return <LoadingState />
  }

  if (error && !data) {
    const variant = detectCardErrorVariant(error as CardError)
    return (
      <Card className="rounded-lg shadow-none">
        <CardContent className="p-4">
          <EmptyState
            variant={variant}
            title={getCardErrorTitle(variant, 'Running Queries')}
            description={getCardErrorDescription(error as CardError, variant)}
            compact
            action={{
              label: 'Retry',
              onClick: refresh,
              icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
            }}
          />
        </CardContent>
      </Card>
    )
  }

  const rows = data ?? []

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {/* Header: title, live count, manual refresh */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm">Running Queries</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
              title={`Auto-refreshes every ${REFRESH_INTERVAL / 1000}s`}
            >
              <Activity
                className={cn(
                  'size-3.5',
                  isValidating
                    ? 'animate-pulse text-green-500'
                    : 'text-muted-foreground/60'
                )}
              />
              Live
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => refresh()}
              disabled={isValidating}
              aria-label="Refresh now"
            >
              <RefreshCw
                className={cn('size-3.5', isValidating && 'animate-spin')}
              />
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <Card className="rounded-lg border-dashed shadow-none">
            <CardContent className="p-6">
              <EmptyState
                variant="no-data"
                title="No queries running"
                description="Nothing is executing on this host right now. New queries appear here automatically."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <RunningQueryCard
                key={String(row.query_id) || `query-${index}`}
                row={row}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
})
