'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

function ReplicasPageContent() {
  return <PageLayout queryConfig={replicasConfig} title="Table Replicas" />
}

export default function ReplicasPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ReplicasPageContent />
    </Suspense>
  )
}
