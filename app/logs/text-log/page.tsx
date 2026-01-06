'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { textLogConfig } from '@/lib/query-config/logs/text-log'

function TextLogContent() {
  return <PageLayout queryConfig={textLogConfig} title="Server Text Log" />
}

export default function TextLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <TextLogContent />
    </Suspense>
  )
}
