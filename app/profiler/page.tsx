'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { profilerConfig } from '@/lib/query-config/queries/profiler'

function ProfilerContent() {
  return <PageLayout queryConfig={profilerConfig} title="Query Profiler" />
}

export default function ProfilerPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ProfilerContent />
    </Suspense>
  )
}
