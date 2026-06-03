import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

function KeeperBrowserPageContent() {
  return (
    <PageLayout queryConfig={zookeeperConfig} title="Keeper Data Browser" />
  )
}

function KeeperBrowserPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <KeeperBrowserPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/keeper/')({
  component: KeeperBrowserPage,
})
