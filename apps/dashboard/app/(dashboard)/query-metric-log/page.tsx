'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { queryMetricLogConfig } from '@/lib/query-config/system/query-metric-log'

function QueryMetricLogPageContent() {
  return (
    <PageLayout queryConfig={queryMetricLogConfig} title="Query Metric Log" />
  )
}

export default function QueryMetricLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <QueryMetricLogPageContent />
    </Suspense>
  )
}
