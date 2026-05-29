'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { QueryDetailView } from '@/components/query-detail/query-detail-view'
import { TableSkeleton } from '@/components/skeletons'

function QueryDetailContent() {
  const searchParams = useSearchParams()
  const query_id = searchParams.get('query_id')

  if (!query_id) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground text-sm">Query ID is required</p>
      </div>
    )
  }

  return <QueryDetailView queryId={query_id} />
}

export default function QueryDetailPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <QueryDetailContent />
    </Suspense>
  )
}
