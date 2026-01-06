'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'

function RunningQueriesContent() {
  return (
    <PageLayout
      queryConfig={runningQueriesConfig}
      title="Running Queries"
      enableRowSelection
    />
  )
}

export default function RunningQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RunningQueriesContent />
    </Suspense>
  )
}
