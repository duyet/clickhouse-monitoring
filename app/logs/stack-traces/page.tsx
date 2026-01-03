'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { stackTracesConfig } from '@/lib/query-config/logs/stack-traces'

function StackTracesContent() {
  return (
    <PageLayout queryConfig={stackTracesConfig} title="Current Stack Traces" />
  )
}

export default function StackTracesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <StackTracesContent />
    </Suspense>
  )
}
