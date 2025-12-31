'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'
import { ChartSkeleton } from '@/components/skeletons'

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
