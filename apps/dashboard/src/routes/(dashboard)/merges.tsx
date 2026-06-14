import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { mergesConfig } from '@/lib/query-config/merges/merges'

function MergesPageContent() {
  return <PageLayout queryConfig={mergesConfig} />
}

function MergesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MergesPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/merges')({
  component: MergesPage,
  head: () => pageOgHead('merges'),
})
