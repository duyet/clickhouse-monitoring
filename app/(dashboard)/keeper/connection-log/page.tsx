'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperConnectionLogConfig } from '@/lib/query-config/keeper'

function KeeperConnectionLogPageContent() {
  return (
    <PageLayout
      queryConfig={keeperConnectionLogConfig}
      title="Keeper Connection Log"
    />
  )
}

export default function KeeperConnectionLogPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperConnectionLogPageContent />
    </Suspense>
  )
}
