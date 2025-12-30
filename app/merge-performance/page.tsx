'use client'

import { PageLayout } from '@/components/page-layout'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'

export default function MergePerformancePage() {
  return (
    <PageLayout
      queryConfig={mergePerformanceConfig}
      title="Merge Performance"
    />
  )
}
