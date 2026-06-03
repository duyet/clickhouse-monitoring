import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { failedQueriesConfig } from '@/lib/query-config/queries/failed-queries'

function FailedQueriesPageContent() {
  return <PageLayout queryConfig={failedQueriesConfig} title="Failed Queries" />
}

function FailedQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <FailedQueriesPageContent />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/failed-queries')({
  component: FailedQueriesPage,
})
