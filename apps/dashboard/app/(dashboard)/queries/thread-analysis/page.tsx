'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { threadAnalysisConfig } from '@/lib/query-config/queries/thread-analysis'

function ThreadAnalysisContent() {
  return (
    <PageLayout queryConfig={threadAnalysisConfig} title="Thread Analysis" />
  )
}

export default function ThreadAnalysisPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ThreadAnalysisContent />
    </Suspense>
  )
}
