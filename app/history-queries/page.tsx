'use client'

export const dynamic = 'force-static'

import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { QueryFiltersBar } from '@/components/history-queries/filter-bar'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

function HistoryQueriesPageContent() {
  const searchParams = useSearchParams()
  const tableSearchParams = useMemo(() => {
    const params: Record<string, string> = {}

    Object.keys(historyQueriesConfig.defaultParams || {}).forEach((key) => {
      const value = searchParams.get(key)
      if (value) {
        params[key] = value
      }
    })

    return params
  }, [searchParams])

  return (
    <PageLayout
      queryConfig={historyQueriesConfig}
      title="History Queries"
      defaultPageSize={100}
      maxTableHeight="calc(100vh - 320px)"
      searchParams={tableSearchParams}
      headerContent={<QueryFiltersBar queryConfig={historyQueriesConfig} />}
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
