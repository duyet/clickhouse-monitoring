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
import { FeatureUnavailable } from '@/components/feature-permissions/feature-unavailable'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { FadeIn } from '@/components/ui/fade-in'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { resolveFeatureState } from '@/lib/feature-permissions/shared'

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
  /** Custom renderer used in place of the default data table (e.g. a card list) */
  tableSlot?: ReactNode
  /** Additional search params to pass to table */
  searchParams?: Record<string, string | number | boolean>
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean
  /** Default page size for the table */
  defaultPageSize?: number
  /** Maximum height for the table card */
  maxTableHeight?: string
}

export const QueryPageLayout = memo(function QueryPageLayout({
  queryConfig,
  title,
  description,
  headerContent,
  footerContent,
  chartsGridClass,
  hideTable = false,
  tableSlot,
  searchParams,
  enableRowSelection = false,
  defaultPageSize,
  maxTableHeight,
}: QueryPageLayoutProps) {
  const { config, isLoading } = useFeaturePermissions()
  const relatedCharts = queryConfig.relatedCharts || []
  const { isCollapsed, toggleCollapsed, collapsedRows, toggleRow } =
    useChartsCollapsed()
  const hasCharts = relatedCharts.length > 0
  const featureState = resolveFeatureState(queryConfig.permission, config)

  if (queryConfig.permission) {
    if (!isLoading && !featureState.enabled) {
      return (
        <FeatureUnavailable
          feature={queryConfig.permission.feature}
          reason="disabled"
        />
      )
    }

    if (
      !isLoading &&
      featureState.access === 'authenticated' &&
      config.principal !== 'authenticated'
    ) {
      return (
        <FeatureUnavailable
          feature={queryConfig.permission.feature}
          reason="auth"
        />
      )
    }
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-3 sm:gap-4">
      {/* Charts Section with Collapse Toggle */}
      {hasCharts && (
        <div className="flex flex-col gap-2">
          <ChartsToggle isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
          {!isCollapsed && (
            <FadeIn duration={200}>
              <RelatedCharts
                relatedCharts={relatedCharts}
                gridClass={chartsGridClass}
                collapsedRows={collapsedRows}
                onToggleRow={toggleRow}
              />
            </FadeIn>
          )}
        </div>
      )}

      {/* Filter bar + Data Table — visually merged when headerContent present */}
      {headerContent ? (
        <div className="flex flex-col">
          {headerContent}
          {!hideTable && (
            <Suspense fallback={<TableSkeleton />}>
              <FadeIn
                duration={300}
                className="flex min-w-0 flex-1 flex-col"
                style={
                  maxTableHeight ? { maxHeight: maxTableHeight } : undefined
                }
              >
                {tableSlot ?? (
                  <TableClient
                    title={title || queryConfig.name}
                    description={description || queryConfig.description}
                    queryConfig={queryConfig}
                    searchParams={searchParams}
                    className="flex min-w-0 flex-1 flex-col"
                    enableRowSelection={enableRowSelection}
                    defaultPageSize={defaultPageSize}
                  />
                )}
              </FadeIn>
            </Suspense>
          )}
        </div>
      ) : (
        !hideTable && (
          <Suspense fallback={<TableSkeleton />}>
            <FadeIn
              duration={300}
              className="flex min-w-0 flex-1 flex-col"
              style={maxTableHeight ? { maxHeight: maxTableHeight } : undefined}
            >
              {tableSlot ?? (
                <TableClient
                  title={title || queryConfig.name}
                  description={description || queryConfig.description}
                  queryConfig={queryConfig}
                  searchParams={searchParams}
                  className="flex min-w-0 flex-1 flex-col"
                  enableRowSelection={enableRowSelection}
                  defaultPageSize={defaultPageSize}
                />
              )}
            </FadeIn>
          </Suspense>
        )
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
  tableSlot?: ReactNode
  searchParams?: Record<string, string | number | boolean>
  enableRowSelection?: boolean
  defaultPageSize?: number
  maxTableHeight?: string
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
