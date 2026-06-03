import { createFileRoute } from '@tanstack/react-router'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { ChartSkeleton } from '@/components/skeletons'
import { dictionariesConfig } from '@/lib/query-config/more/dictionaries'

function DictionariesContent() {
  return <PageLayout queryConfig={dictionariesConfig} title="Dictionaries" />
}

function DictionariesPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DictionariesContent />
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/dictionaries')({
  component: DictionariesPage,
})
