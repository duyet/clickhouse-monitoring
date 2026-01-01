'use client'

import { Suspense } from 'react'
import { QueryPageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

function MutationsPageContent() {
  return <QueryPageLayout queryConfig={mutationsConfig} />
}

export default function MutationsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MutationsPageContent />
    </Suspense>
  )
}
