import { Suspense } from 'react'
import { ChartSkeleton } from '@/components/skeletons'
import { FailedQueriesPageContent } from './content'

// Skip static prerendering - page requires query params
export const dynamic = 'force-dynamic'

export default function FailedQueriesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <FailedQueriesPageContent />
    </Suspense>
  )
}
