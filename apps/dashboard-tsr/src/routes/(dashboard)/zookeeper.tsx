import { createFileRoute } from '@tanstack/react-router'
import { useRouter, useSearchParams } from '@/lib/next-compat'
import { Suspense, useEffect } from 'react'
import { ChartSkeleton } from '@/components/skeletons'

/**
 * Legacy route. ZooKeeper monitoring moved under the dedicated "Keeper" menu
 * section at `/keeper`. Redirect client-side (static site — no server
 * redirects) while preserving the `?path=` query param so existing bookmarks
 * keep working.
 */
function ZookeeperRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    router.replace(`/keeper${query ? `?${query}` : '?path=/'}`)
  }, [router, searchParams])

  return <ChartSkeleton />
}

function ZookeeperPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ZookeeperRedirect />
    </Suspense>
  )
}


export const Route = createFileRoute('/(dashboard)/zookeeper')({
  component: ZookeeperPage,
})
