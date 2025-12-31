'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'
import { ChartSkeleton } from '@/components/skeletons'

function MergePerformancePageContent() {
  return (
    <PageLayout
      queryConfig={mergePerformanceConfig}
      title="Merge Performance"
    />
  )
}

export default function MergePerformancePage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MergePerformancePageContent />
    </Suspense>
  )
}
