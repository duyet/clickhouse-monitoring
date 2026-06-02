'use client'

import { Suspense } from 'react'
import { KeeperNodeCards } from '@/components/keeper/keeper-node-cards'
import { KeeperOverviewKpis } from '@/components/keeper/keeper-overview-kpis'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperOverviewConfig } from '@/lib/query-config/keeper'

function KeeperOverviewContent() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <KeeperOverviewKpis />
      <PageLayout
        queryConfig={keeperOverviewConfig}
        title="Keeper Nodes"
        tableSlot={<KeeperNodeCards />}
      />
    </div>
  )
}

export default function KeeperOverviewPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperOverviewContent />
    </Suspense>
  )
}
