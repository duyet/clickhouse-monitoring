'use client'

import { ArrowRight, ChevronDown, History, RefreshCw } from 'lucide-react'

import type { RunningQueryRow } from '@/components/running-queries/running-queries-table'
import type { CardError } from '@/lib/card-error-utils'

import { useSearchParams } from 'next/navigation'
import { memo, useMemo, useState } from 'react'
import { RunningQueriesCharts } from '@/components/running-queries/running-queries-charts'
import { RunningQueriesTable } from '@/components/running-queries/running-queries-table'
import { Skeleton } from '@/components/skeletons'
import { AppLink } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  detectCardErrorVariant,
  getCardErrorDescription,
  getCardErrorTitle,
} from '@/lib/card-error-utils'
import {
  parseFiltersFromParams,
  serializeActiveFilters,
} from '@/lib/filters/url-state'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'
import { useHostId } from '@/lib/swr/use-host'
import { useTableData } from '@/lib/swr/use-table-data'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

/**
 * Auto-refresh cadence for the running-queries list (ms).
 *
 * Defaults to 5s so the table reads as genuinely "live"; `system.processes`
 * is an in-memory table, so frequent polling is cheap.
 * Override with `NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS`.
 */
const REFRESH_INTERVAL = (() => {
  const envValue = process.env.NEXT_PUBLIC_RUNNING_QUERIES_REFRESH_MS
  const parsed = envValue ? Number.parseInt(envValue, 10) : NaN
  return !Number.isNaN(parsed) && parsed > 0 ? parsed : 5_000
})()

const REFRESH_SECONDS = Math.round(REFRESH_INTERVAL / 1000)

/** Skeleton placeholder shown during the initial load. */
function LoadingState() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-3 py-3"
        >
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

/**
 * Link card to the full query history — completed queries leave the live
 * list, so this points to where they can still be inspected.
 */
function HistoryLink({ hostId }: { hostId: number }) {
  return (
    <AppLink
      href={buildUrl('/history-queries', { host: hostId })}
      className="group flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <History className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">Completed queries</span>
        <span className="block text-[12px] text-muted-foreground">
          Queries that finish leave this list — browse them in query history.
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        View history
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </AppLink>
  )
}

/** Header action button — outlined, compact, matches the redesign. */
function HeaderButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-[12px]"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}

/**
 * RunningQueriesView — the Running Queries page.
 *
 * A self-contained layout: header (title, live count, charts toggle, refresh,
 * live toggle) → collapsible four-card chart strip → the sortable
 * {@link RunningQueriesTable}. Data comes from `system.processes`; auto-refresh
 * runs on {@link REFRESH_INTERVAL} while "Live" is on and pauses when off.
 */
export const RunningQueriesView = memo(function RunningQueriesView() {
  const hostId = useHostId()
  const searchParams = useSearchParams()
  const [chartsOpen, setChartsOpen] = useState(true)
  const [live, setLive] = useState(true)

  // Pipe URL-driven filter params into the SWR key so the schema-driven
  // header filters and bar (rendered by the underlying DataTable) actually
  // shape the data fetched from /api/v1/tables/running-queries.
  const filterParams = useMemo(() => {
    const schema = runningQueriesConfig.filterSchema
    if (!schema) return undefined
    const serialized = serializeActiveFilters(
      parseFiltersFromParams(schema, searchParams)
    )
    // Map the `q` text-search param to a server-side `contains` on the query column.
    const q = searchParams.get('q')
    if (q?.trim()) {
      serialized.query = `contains:${q.trim()}`
    }
    return Object.keys(serialized).length > 0 ? serialized : undefined
  }, [searchParams])

  const { data, error, isLoading, isValidating, refresh } =
    useTableData<RunningQueryRow>(
      'running-queries',
      hostId,
      filterParams,
      live ? REFRESH_INTERVAL : 0
    )

  const rows = data ?? []

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-[22px]">
                Running Queries
              </h1>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {rows.length} active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeaderButton onClick={() => setChartsOpen((v) => !v)}>
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform',
                    !chartsOpen && '-rotate-90'
                  )}
                />
                {chartsOpen ? 'Hide charts' : 'Show charts'}
              </HeaderButton>
              <HeaderButton onClick={() => refresh()} disabled={isValidating}>
                <RefreshCw
                  className={cn('size-3.5', isValidating && 'animate-spin')}
                />
                Refresh
              </HeaderButton>
              <HeaderButton onClick={() => setLive((v) => !v)}>
                <span className="relative inline-flex size-2">
                  {live && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                  )}
                  <span
                    className={cn(
                      'relative inline-flex size-2 rounded-full',
                      live ? 'bg-rose-500' : 'bg-muted-foreground/40'
                    )}
                  />
                </span>
                {live ? 'Live' : 'Paused'}
              </HeaderButton>
            </div>
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            Queries currently executing on the cluster
            {live
              ? ` · auto-refreshes every ${REFRESH_SECONDS}s`
              : ' · auto-refresh paused'}
          </p>
        </div>

        {/* Body */}
        {isLoading && !data ? (
          <LoadingState />
        ) : error && !data ? (
          <Card className="rounded-xl shadow-none">
            <CardContent className="p-4">
              <EmptyState
                variant={detectCardErrorVariant(error as CardError)}
                title={getCardErrorTitle(
                  detectCardErrorVariant(error as CardError),
                  'Running Queries'
                )}
                description={getCardErrorDescription(
                  error as CardError,
                  detectCardErrorVariant(error as CardError)
                )}
                compact
                action={{
                  label: 'Retry',
                  onClick: refresh,
                  icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {chartsOpen && <RunningQueriesCharts rows={rows} hostId={hostId} />}
            {rows.length === 0 ? (
              <Card className="rounded-xl border-dashed shadow-none">
                <CardContent className="p-6">
                  <EmptyState
                    variant="no-data"
                    title="No queries running"
                    description="Nothing is executing on this host right now. New queries appear here automatically."
                  />
                </CardContent>
              </Card>
            ) : (
              <RunningQueriesTable rows={rows} />
            )}
            <HistoryLink hostId={hostId} />
          </>
        )}
      </div>
    </TooltipProvider>
  )
})
