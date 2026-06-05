import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { keeperWatchesConfig } from '@/lib/query-config/keeper'

function KeeperWatchesPageContent() {
  return <PageLayout queryConfig={keeperWatchesConfig} title="Keeper Watches" />
}

function KeeperWatchesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <KeeperWatchesPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/keeper/watches')({
  component: KeeperWatchesPage,
})
