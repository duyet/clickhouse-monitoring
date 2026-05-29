'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { parallelizationConfig } from '@/lib/query-config/queries/parallelization'

function ParallelizationContent() {
  return (
    <PageLayout
      queryConfig={parallelizationConfig}
      title="Query Parallelization"
    />
  )
}

export default function ParallelizationPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ParallelizationContent />
    </Suspense>
  )
}
