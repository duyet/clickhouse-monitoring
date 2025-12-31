'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { pageViewsConfig } from '@/lib/query-config/more/page-views'
import { ChartSkeleton } from '@/components/skeletons'

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
