import { createFileRoute } from '@tanstack/react-router'
import dynamicModule from 'next/dynamic'
import { Suspense } from 'react'
import { ExplorerSkeleton } from '@/components/skeletons'

const ExplorerLayout = dynamicModule(
  () =>
    import('@/components/explorer/explorer-layout').then(
      (m) => m.ExplorerLayout
    ),
  { ssr: false, loading: () => <ExplorerSkeleton /> }
)

function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <div className="h-[calc(100vh-4rem)]">
        <ExplorerLayout />
      </div>
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/explorer')({
  component: ExplorerPage,
})
