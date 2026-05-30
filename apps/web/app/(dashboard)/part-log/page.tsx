'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { partLogConfig } from '@/lib/query-config/system/part-log'

function PartLogPageContent() {
  return <PageLayout queryConfig={partLogConfig} title="Part Log" />
}

export default function PartLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PartLogPageContent />
    </Suspense>
  )
}
