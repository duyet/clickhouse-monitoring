import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { backupsConfig } from '@/lib/query-config/more/backups'

function BackupsPageContent() {
  return <PageLayout queryConfig={backupsConfig} title="Backups" />
}

function BackupsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BackupsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/backups')({
  component: BackupsPage,
})
