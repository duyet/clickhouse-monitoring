'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

function FailedQueriesPageContent() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}

export default function FailedQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <FailedQueriesPageContent />
    </Suspense>
  )
}
