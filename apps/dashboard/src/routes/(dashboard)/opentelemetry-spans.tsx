import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { opentelemetrySpansConfig } from '@/lib/query-config/system/opentelemetry-spans'

function OpenTelemetrySpansPageContent() {
  return (
    <PageLayout
      queryConfig={opentelemetrySpansConfig}
      title="OpenTelemetry Spans"
      description="Distributed query trace waterfall: spans grouped by trace_id across replicas and shards. Requires opentelemetry_start_trace_probability > 0."
    />
  )
}

function OpenTelemetrySpansPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OpenTelemetrySpansPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/opentelemetry-spans')({
  component: OpenTelemetrySpansPage,
  head: () => pageOgHead('opentelemetry-spans'),
})
