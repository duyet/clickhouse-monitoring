'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { mergesConfig } from '@/lib/query-config/merges/merges'

function MergesPageContent() {
  return <PageLayout queryConfig={mergesConfig} />
}

export default function MergesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MergesPageContent />
    </Suspense>
  )
}
