import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { QueryPageLayout } from '@/components/layout/query-page'
import { PageSkeleton } from '@/components/skeletons'
import { pageOgHead } from '@/lib/og'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

function MutationsPageContent() {
  return <QueryPageLayout queryConfig={mutationsConfig} />
}

function MutationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MutationsPageContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/mutations')({
  component: MutationsPage,
  head: () => pageOgHead('mutations'),
})
