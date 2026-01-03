import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { QueryDetailContent } from './content'

// Skip static prerendering - page requires query params
export const dynamic = 'force-dynamic'

export default function QueryDetailPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <QueryDetailContent />
    </Suspense>
  )
}
