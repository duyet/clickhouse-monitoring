import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

function FailedQueriesPageContent() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}

function FailedQueriesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FailedQueriesPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/failed-queries')({
  component: FailedQueriesPage,
  head: () => pageOgHead('failed-queries'),
})
