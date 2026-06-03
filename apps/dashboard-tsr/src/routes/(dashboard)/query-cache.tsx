import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { queryCacheConfig } from '@/lib/query-config/queries/query-cache'

function QueryCachePageContent() {
  return <PageLayout queryConfig={queryCacheConfig} title="Query Cache" />
}

function QueryCachePage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <QueryCachePageContent />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/query-cache')({
  component: QueryCachePage,
})
