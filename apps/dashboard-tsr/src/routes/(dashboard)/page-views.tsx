import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { pageViewsConfig } from '@/lib/query-config/more/page-views'

function PageViewsPageContent() {
  return <PageLayout queryConfig={pageViewsConfig} title="Page Views" />
}

function PageViewsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PageViewsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/page-views')({
  component: PageViewsPage,
})
