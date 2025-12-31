'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'
import { ChartSkeleton } from '@/components/skeletons'

function RunningQueriesPageContent() {
  return (
    <PageLayout queryConfig={runningQueriesConfig} title="Running Queries" />
  )
}

export default function RunningQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RunningQueriesPageContent />
    </Suspense>
  )
}
