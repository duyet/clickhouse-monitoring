'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'
import { ChartSkeleton } from '@/components/skeletons'

function ZookeeperPageContent() {
  return <PageLayout queryConfig={zookeeperConfig} title="ZooKeeper" />
}

export default function ZookeeperPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ZookeeperPageContent />
    </Suspense>
  )
}
