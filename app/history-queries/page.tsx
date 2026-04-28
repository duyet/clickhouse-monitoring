'use client'

export const dynamic = 'force-static'

import { Suspense } from 'react'
import { QueryFiltersBar } from '@/components/history-queries/filter-bar'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'
import { useHostId } from '@/lib/swr'

function HistoryQueriesPageContent() {
  const hostId = useHostId()

  return (
    <PageLayout
      queryConfig={historyQueriesConfig}
      title="History Queries"
      defaultPageSize={100}
      maxTableHeight="400px"
      headerContent={
        <QueryFiltersBar queryConfig={historyQueriesConfig} hostId={hostId} />
      }
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
