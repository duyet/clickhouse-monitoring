'use client'

import { Suspense } from 'react'
import { PartLogView } from '@/components/part-log'
import { ChartSkeleton } from '@/components/skeletons'

export default function PartLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <PartLogView />
    </Suspense>
  )
}
