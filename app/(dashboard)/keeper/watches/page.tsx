'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperWatchesConfig } from '@/lib/query-config/keeper'

function KeeperWatchesPageContent() {
  return <PageLayout queryConfig={keeperWatchesConfig} title="Keeper Watches" />
}

export default function KeeperWatchesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperWatchesPageContent />
    </Suspense>
  )
}
