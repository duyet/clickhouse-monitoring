'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

function KeeperBrowserPageContent() {
  return (
    <PageLayout queryConfig={zookeeperConfig} title="Keeper Data Browser" />
  )
}

export default function KeeperBrowserPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperBrowserPageContent />
    </Suspense>
  )
}
