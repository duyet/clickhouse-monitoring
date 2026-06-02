'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperConnectionsConfig } from '@/lib/query-config/keeper'

function KeeperConnectionsPageContent() {
  return (
    <PageLayout
      queryConfig={keeperConnectionsConfig}
      title="Keeper Connections"
    />
  )
}

export default function KeeperConnectionsPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperConnectionsPageContent />
    </Suspense>
  )
}
