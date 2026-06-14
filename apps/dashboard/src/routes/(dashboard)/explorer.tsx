import { createFileRoute } from '@tanstack/react-router'

import { lazy, Suspense } from 'react'
import { ExplorerSkeleton } from '@/components/skeletons'

// Lazy-load the explorer layout — large chunk, excluded from the static
// prerender so the HTML stays small; loads client-side after hydration.
const ExplorerLayout = lazy(() =>
  import('@/components/explorer/explorer-layout').then((m) => ({
    default: m.ExplorerLayout,
  }))
)

function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <div className="h-[calc(100dvh-6rem)]">
        <ExplorerLayout />
      </div>
    </Suspense>
  )
}

export const Route = createFileRoute('/(dashboard)/explorer')({
  component: ExplorerPage,
  head: () => ({
    meta: [
      { title: 'Database Explorer — chmonitor' },
      { property: 'og:title', content: 'Database Explorer — chmonitor' },
      {
        property: 'og:image',
        content: 'https://dash.chmonitor.dev/og-explorer.png',
      },
      {
        name: 'twitter:image',
        content: 'https://dash.chmonitor.dev/og-explorer.png',
      },
    ],
  }),
})
