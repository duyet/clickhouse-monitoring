'use client'

import { Suspense } from 'react'
import { KeeperNodeCards } from '@/components/keeper/keeper-node-cards'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { keeperInfoConfig } from '@/lib/query-config/keeper'

function KeeperInfoPageContent() {
  return (
    <PageLayout
      queryConfig={keeperInfoConfig}
      title="Keeper Info"
      tableSlot={<KeeperNodeCards />}
    />
  )
}

export default function KeeperInfoPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperInfoPageContent />
    </Suspense>
  )
}
