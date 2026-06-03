import { createFileRoute } from '@tanstack/react-router'
import { useRouter, useSearchParams } from '@/lib/next-compat'
import { useEffect } from 'react'

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
