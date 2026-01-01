'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { pageViewsConfig } from '@/lib/query-config/more/page-views'

function PageViewsPageContent() {
  return <PageLayout queryConfig={pageViewsConfig} title="Page Views" />
}

export default function PageViewsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PageViewsPageContent />
    </Suspense>
  )
}
