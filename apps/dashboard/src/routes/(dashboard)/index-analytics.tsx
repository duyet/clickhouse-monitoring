import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { indexAnalyticsConfig } from '@/lib/query-config/system/index-analytics'
import { projectionAnalyticsConfig } from '@/lib/query-config/system/projection-analytics'

function IndexAnalyticsPageContent() {
  return (
    <Tabs defaultValue="indexes" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="indexes">Data-Skipping Indexes</TabsTrigger>
        <TabsTrigger value="projections">Projections</TabsTrigger>
      </TabsList>
      <TabsContent value="indexes">
        <PageLayout
          queryConfig={indexAnalyticsConfig}
          title="Data-Skipping Indexes"
          description="Inventory of data-skipping indexes with storage cost and type. Dead indexes (zero size) are flagged for potential removal."
        />
      </TabsContent>
      <TabsContent value="projections">
        <PageLayout
          queryConfig={projectionAnalyticsConfig}
          title="Projection Analytics"
          description="Projection storage cost and row counts across all tables. Empty projections (zero rows) are candidates for removal."
        />
      </TabsContent>
    </Tabs>
  )
}

function IndexAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IndexAnalyticsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/index-analytics')({
  component: IndexAnalyticsPage,
  head: () => pageOgHead('index-analytics'),
})
