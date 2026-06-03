import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'

function MergePerformancePageContent() {
  return (
    <PageLayout
      queryConfig={mergePerformanceConfig}
      title="Merge Performance"
    />
  )
}

function MergePerformancePage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MergePerformancePageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/merge-performance')({
  component: MergePerformancePage,
})
