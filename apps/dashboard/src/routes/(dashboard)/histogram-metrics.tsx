import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { histogramMetricsConfig } from '@/lib/query-config/system/histogram-metrics'
import { latencyLogConfig } from '@/lib/query-config/system/latency-log'

function HistogramMetricsPageContent() {
  return (
    <Tabs defaultValue="histogram" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="histogram">Histogram Metrics (25.x)</TabsTrigger>
        <TabsTrigger value="latency">Latency Log (Legacy)</TabsTrigger>
      </TabsList>
      <TabsContent value="histogram">
        <PageLayout
          queryConfig={histogramMetricsConfig}
          title="Histogram Metrics"
          description="Instant histogram snapshots for Keeper stages, query durations, and other latency distributions (CH 25.1+)."
        />
      </TabsContent>
      <TabsContent value="latency">
        <PageLayout
          queryConfig={latencyLogConfig}
          title="Latency Log (Deprecated)"
          description="Per-operation latency log (CH 22.x–24.x). Replaced by system.histogram_metrics in CH 25.1+."
        />
      </TabsContent>
    </Tabs>
  )
}

function HistogramMetricsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HistogramMetricsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/histogram-metrics')({
  component: HistogramMetricsPage,
  head: () => pageOgHead('histogram-metrics'),
})
