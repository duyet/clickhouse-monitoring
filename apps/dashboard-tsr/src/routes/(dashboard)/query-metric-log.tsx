import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { queryMetricLogConfig } from '@/lib/query-config/system/query-metric-log'

function QueryMetricLogPageContent() {
  return (
    <PageLayout queryConfig={queryMetricLogConfig} title="Query Metric Log" />
  )
}

function QueryMetricLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <QueryMetricLogPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/query-metric-log')({
  component: QueryMetricLogPage,
})
