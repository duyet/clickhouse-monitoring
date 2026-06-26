import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { queryConditionCacheConfig } from '@/lib/query-config/queries/query-condition-cache'

function QueryConditionCachePageContent() {
  return (
    <PageLayout
      queryConfig={queryConditionCacheConfig}
      title="Query Condition Cache"
    />
  )
}

function QueryConditionCachePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <QueryConditionCachePageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/query-condition-cache')({
  component: QueryConditionCachePage,
  head: () => pageOgHead('query-condition-cache'),
})
