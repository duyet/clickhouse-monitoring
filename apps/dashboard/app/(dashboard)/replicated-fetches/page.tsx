'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { replicatedFetchesConfig } from '@/lib/query-config/tables/replicated-fetches'

function ReplicatedFetchesPageContent() {
  return (
    <PageLayout
      queryConfig={replicatedFetchesConfig}
      title="Replicated Fetches"
    />
  )
}

export default function ReplicatedFetchesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ReplicatedFetchesPageContent />
    </Suspense>
  )
}
