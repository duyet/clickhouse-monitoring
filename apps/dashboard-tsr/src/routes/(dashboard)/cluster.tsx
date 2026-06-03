import { createFileRoute } from '@tanstack/react-router'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from '@/lib/next-compat'

/** Redirect /cluster → /clusters (topology + table merged into one page) */
function ClusterRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    router.replace(`/clusters?${searchParams.toString()}`)
  }, [router, searchParams])

  return null
}

export const Route = createFileRoute('/(dashboard)/cluster')({
  component: ClusterRedirectPage,
})
