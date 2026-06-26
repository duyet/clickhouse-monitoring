import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import {
  storagePoliciesConfig,
  storageCompressionConfig,
  ttlStorageMovesConfig,
} from '@/lib/query-config/system/storage-economics'

function StorageEconomicsPageContent() {
  return (
    <div className="flex flex-col gap-6">
      <PageLayout
        queryConfig={storageCompressionConfig}
        title="Compression by Table"
      />
      <PageLayout
        queryConfig={storagePoliciesConfig}
        title="Storage Policies"
      />
      <PageLayout
        queryConfig={ttlStorageMovesConfig}
        title="TTL Storage Moves"
      />
    </div>
  )
}

function StorageEconomicsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StorageEconomicsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/storage-economics')({
  component: StorageEconomicsPage,
  head: () => pageOgHead('storage-economics'),
})
