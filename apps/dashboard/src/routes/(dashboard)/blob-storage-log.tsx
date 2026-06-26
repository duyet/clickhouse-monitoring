import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { blobStorageLogConfig } from '@/lib/query-config/system/blob-storage-log'

function BlobStorageLogPageContent() {
  return (
    <PageLayout queryConfig={blobStorageLogConfig} title="Blob Storage Log" />
  )
}

function BlobStorageLogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BlobStorageLogPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/blob-storage-log')({
  component: BlobStorageLogPage,
  head: () => pageOgHead('blob-storage-log'),
})
