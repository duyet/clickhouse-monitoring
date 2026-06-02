'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/** Redirect /cluster → /clusters (topology + table merged into one page) */
export default function ClusterRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    router.replace(`/clusters?${searchParams.toString()}`)
  }, [router, searchParams])

  return null
}
