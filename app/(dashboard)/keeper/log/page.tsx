'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperLogConfig } from '@/lib/query-config/keeper'

function KeeperLogPageContent() {
  return <PageLayout queryConfig={keeperLogConfig} title="Keeper Request Log" />
}

export default function KeeperLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperLogPageContent />
    </Suspense>
  )
}
