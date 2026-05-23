'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { FilterBar } from '@/components/filters/filter-bar'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import {
  parseFiltersFromParams,
  serializeActiveFilters,
} from '@/lib/filters/url-state'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

function HistoryQueriesPageContent() {
  const searchParams = useSearchParams()

  // Normalize URL filter state into the params the table query consumes.
  const tableSearchParams = useMemo(() => {
    const schema = historyQueriesConfig.filterSchema
    if (!schema) return {}
    const params = serializeActiveFilters(
      parseFiltersFromParams(schema, searchParams)
    )
    // Map the `q` text-search param to a server-side `contains` on the query column.
    const q = searchParams.get('q')
    if (q?.trim()) {
      params.query = `contains:${q.trim()}`
    }
    return params
  }, [searchParams])

  return (
    <PageLayout
      queryConfig={historyQueriesConfig}
      title="History Queries"
      defaultPageSize={100}
      searchParams={tableSearchParams}
      headerContent={<FilterBar queryConfig={historyQueriesConfig} />}
    />
  )
}

export default function HistoryQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HistoryQueriesPageContent />
    </Suspense>
  )
}
