/**
 * QueryPageLayout Component
 *
 * Generic page layout for query-based data pages.
 *
 * Provides:
 * - Optional header/footer content slots
 * - Collapsible related charts grid with localStorage persistence
 * - Data table integration
 * - Responsive chart grid (1→2→3→4 columns based on count)
 *
 * Usage:
 * ```tsx
 * import { QueryPageLayout } from '@/components/layout/query-page'
 * import { myQueryConfig } from '@/lib/query-config'
 *
 * export default function MyPage() {
 *   return <QueryPageLayout queryConfig={myQueryConfig} title="My Data" />
 * }
 * ```
 */

'use client'

import type { QueryConfig } from '@/types/query-config'

import { ChartsToggle } from './charts-toggle'
import { RelatedCharts } from './related-charts'
import { useChartsCollapsed } from './use-charts-collapsed'
import { memo, type ReactNode, Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { FadeIn } from '@/components/ui/fade-in'
import { useHostId } from '@/lib/swr'

export interface QueryPageLayoutProps {
  /** Query config for the page table */
  queryConfig: QueryConfig
  /** Title for the table (defaults to queryConfig.name) */
  title?: string
  /** Description for the table (defaults to queryConfig.description) */
  description?: string
  /** Additional content to render above charts */
  headerContent?: ReactNode
  /** Additional content to render after table */
  footerContent?: ReactNode
  /** Custom grid class for charts */
  chartsGridClass?: string
  /** Whether to hide the table */
  hideTable?: boolean
  /** Additional search params to pass to table */
  searchParams?: Record<string, string | number | boolean>
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean
}

export const QueryPageLayout = memo(function QueryPageLayout({
  queryConfig,
  title,
  description,
  headerContent,
  footerContent,
  chartsGridClass,
  hideTable = false,
  searchParams,
  enableRowSelection = false,
}: QueryPageLayoutProps) {
  const hostId = useHostId()
  const relatedCharts = queryConfig.relatedCharts || []
  const { isCollapsed, toggleCollapsed, collapsedRows, toggleRow } =
    useChartsCollapsed()
  const hasCharts = relatedCharts.length > 0

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 w-full max-w-full">
      {/* Optional Header Content */}
      {headerContent}

      {/* Charts Section with Collapse Toggle */}
      {hasCharts && (
        <div className="flex flex-col gap-2">
          <ChartsToggle isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
          {!isCollapsed && (
            <FadeIn duration={200}>
              <RelatedCharts
                relatedCharts={relatedCharts}
                hostId={hostId}
                gridClass={chartsGridClass}
                collapsedRows={collapsedRows}
                onToggleRow={toggleRow}
              />
            </FadeIn>
          )}
        </div>
      )}

      {/* Data Table - flex-1 to fill remaining space */}
      {!hideTable && (
        <Suspense fallback={<TableSkeleton />}>
          <FadeIn duration={300} className="flex min-w-0 flex-1 flex-col">
            <TableClient
              title={title || queryConfig.name}
              description={description || queryConfig.description}
              queryConfig={queryConfig}
              searchParams={searchParams}
              className="flex min-w-0 flex-1 flex-col"
              enableRowSelection={enableRowSelection}
            />
          </FadeIn>
        </Suspense>
      )}

      {/* Optional Footer Content */}
      {footerContent}
    </div>
  )
})

/**
 * Options for creating a standardized page from a QueryConfig
 */
export interface CreateQueryPageOptions {
  queryConfig: QueryConfig
  title?: string
  description?: string
  headerContent?: ReactNode
  footerContent?: ReactNode
  chartsGridClass?: string
  hideTable?: boolean
  searchParams?: Record<string, string | number | boolean>
  enableRowSelection?: boolean
}

/**
 * HOC for creating a page from a QueryConfig.
 *
 * Usage:
 * ```tsx
 * import { createQueryPage } from '@/components/layout/query-page'
 * import { myQueryConfig } from '@/lib/query-config'
 *
 * export default createQueryPage({
 *   queryConfig: myQueryConfig,
 *   title: 'My Data',
 * })
 * ```
 */
export function createQueryPage(options: CreateQueryPageOptions) {
  return memo(function Page() {
    return <QueryPageLayout {...options} />
  })
}
