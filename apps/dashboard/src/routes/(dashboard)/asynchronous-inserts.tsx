import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pageOgHead } from '@/lib/og'
import { asynchronousInsertLogConfig } from '@/lib/query-config/system/asynchronous-insert-log'
import { asynchronousInsertsConfig } from '@/lib/query-config/system/asynchronous-inserts'

function AsyncInsertsPageContent() {
  return (
    <Tabs defaultValue="live" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="live">Live Queue</TabsTrigger>
        <TabsTrigger value="history">Flush History</TabsTrigger>
      </TabsList>
      <TabsContent value="live">
        <PageLayout
          queryConfig={asynchronousInsertsConfig}
          title="Async Insert Queue"
          description="Pending async-insert entries per table. Since CH 26.2, insert deduplication is ON by default."
        />
      </TabsContent>
      <TabsContent value="history">
        <PageLayout
          queryConfig={asynchronousInsertLogConfig}
          title="Async Insert Flush History"
        />
      </TabsContent>
    </Tabs>
  )
}

function AsyncInsertsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AsyncInsertsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/asynchronous-inserts')({
  component: AsyncInsertsPage,
  head: () => pageOgHead('asynchronous-inserts'),
})
