'use client'

import { PageLayout } from '@/components/layout/query-page'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'

export default function MergePerformancePage() {
  return (
    <PageLayout
      queryConfig={mergePerformanceConfig}
      title="Merge Performance"
    />
  )
}
