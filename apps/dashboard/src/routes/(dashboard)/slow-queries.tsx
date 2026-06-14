import { createFileRoute } from '@tanstack/react-router'

import { SlowQueriesView } from '@/components/slow-queries'
import { pageOgHead } from '@/lib/og'

function SlowQueriesPage() {
  return <SlowQueriesView />
}

export const Route = createFileRoute('/(dashboard)/slow-queries')({
  component: SlowQueriesPage,
  head: () => pageOgHead('slow-queries'),
})
