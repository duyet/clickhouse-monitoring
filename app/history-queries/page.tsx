'use client'

export const dynamic = 'force-static'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

function HistoryQueriesPageContent() {
  return (
    <PageLayout
      queryConfig={historyQueriesConfig}
      title="History Queries"
      defaultPageSize={100}
      maxTableHeight="400px"
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
