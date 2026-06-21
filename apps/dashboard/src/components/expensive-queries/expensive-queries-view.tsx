import {
  Flame,
  LayoutDashboardIcon,
  MinimizeIcon,
  RefreshCw,
} from 'lucide-react'

import type { ExpensiveQueryRow } from '@/components/expensive-queries/expensive-queries-table'
import type { CardError } from '@/lib/card-error-utils'

import { useState } from 'react'
import { ExpensiveQueriesTable } from '@/components/expensive-queries/expensive-queries-table'
import { LoadSummary } from '@/components/expensive-queries/load-summary'
import { PageHeader } from '@/components/layout'
import { CollapsedChartsRow } from '@/components/layout/query-page/collapsed-charts-row'
import { RelatedCharts } from '@/components/layout/query-page/related-charts'
import { HeaderButton } from '@/components/query-tables/header-button'
import { QueryPageSkeleton } from '@/components/query-tables/query-page-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  detectCardErrorVariant,
  getCardErrorDescription,
  getCardErrorTitle,
  toEmptyStateVariant,
} from '@/lib/card-error-utils'
import { useTableData } from '@/lib/query/use-table-data'
import { expensiveQueriesConfig } from '@/lib/query-config/queries/expensive-queries'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

// LoadingState is replaced by QueryPageSkeleton from @/components/query-tables/query-page-skeleton
// HeaderButton is imported from @/components/query-tables/header-button

/**
 * ExpensiveQueriesView — the Most Expensive Queries page.
 *
 * A self-contained layout: header (title, fingerprint count, charts toggle,
 * refresh) → a collapsible related-charts strip → the sortable, responsive
 * {@link ExpensiveQueriesTable}. Data is the `expensive-queries` config —
 * normalized query fingerprints aggregated over the last 24h of
 * `system.query_log`, ordered most-expensive-first.
 */
export const ExpensiveQueriesView = function ExpensiveQueriesView() {
  const hostId = useHostId()
  const [chartsOpen, setChartsOpen] = useState(true)

  const { data, error, isLoading, isValidating, refresh } =
    useTableData<ExpensiveQueryRow>('expensive-queries', hostId)

  const rows = data ?? []

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-rose-500" />
              Most Expensive Queries
              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium tabular-nums text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                {rows.length}
              </span>
            </div>
          }
          description="Top query fingerprints by cost over the last 24 hours · aggregated from system.query_log"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              {expensiveQueriesConfig.relatedCharts &&
                expensiveQueriesConfig.relatedCharts.length > 0 && (
                  <HeaderButton onClick={() => setChartsOpen((v) => !v)}>
                    {chartsOpen ? (
                      <MinimizeIcon className="size-3.5" />
                    ) : (
                      <LayoutDashboardIcon className="size-3.5" />
                    )}
                    {chartsOpen ? 'Collapse charts' : 'Expand charts'}
                  </HeaderButton>
                )}
              <HeaderButton onClick={() => refresh()} disabled={isValidating}>
                <RefreshCw
                  className={cn('size-3.5', isValidating && 'animate-spin')}
                />
                Refresh
              </HeaderButton>
            </div>
          }
        />

        {/* Body */}
        {isLoading && !data ? (
          <QueryPageSkeleton />
        ) : error && !data ? (
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <EmptyState
                variant={toEmptyStateVariant(
                  detectCardErrorVariant(error as CardError)
                )}
                title={getCardErrorTitle(
                  detectCardErrorVariant(error as CardError),
                  'Expensive Queries'
                )}
                description={getCardErrorDescription(
                  error as CardError,
                  detectCardErrorVariant(error as CardError)
                )}
                compact
                action={{
                  label: 'Retry',
                  onClick: refresh,
                  icon: <RefreshCw className="mr-1.5 size-3.5" />,
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Heavy-vs-light load summary, derived from the fetched rows. */}
            {rows.length > 0 && <LoadSummary rows={rows} />}
            {expensiveQueriesConfig.relatedCharts &&
              expensiveQueriesConfig.relatedCharts.length > 0 &&
              (chartsOpen ? (
                <RelatedCharts
                  relatedCharts={expensiveQueriesConfig.relatedCharts}
                />
              ) : (
                <CollapsedChartsRow
                  labels={expensiveQueriesConfig.relatedCharts
                    .filter(
                      (c): c is Exclude<typeof c, 'break' | null | undefined> =>
                        Boolean(c) && c !== 'break'
                    )
                    .map((c) => {
                      const name = Array.isArray(c) ? c[0] : (c as string)
                      const props = Array.isArray(c)
                        ? (c[1] as { title?: string } | undefined)
                        : undefined
                      return props?.title ?? name.replace(/-/g, ' ')
                    })}
                  onExpand={() => setChartsOpen(true)}
                />
              ))}
            {rows.length === 0 ? (
              <Card className="rounded-xl border-dashed">
                <CardContent className="p-6">
                  <EmptyState
                    variant="no-data"
                    title="No expensive queries"
                    description="No query activity recorded in the last 24 hours on this host."
                  />
                </CardContent>
              </Card>
            ) : (
              <ExpensiveQueriesTable rows={rows} />
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
