import { createFileRoute } from '@tanstack/react-router'

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

function ParallelizationPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ParallelizationContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/queries/parallelization')({
  component: ParallelizationPage,
})
