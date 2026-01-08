'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function TablesRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    const host = searchParams.get('host')

    // Preserve host parameter when redirecting
    if (host) params.set('host', host)
    params.set('database', 'default')

    router.replace(`/table?${params.toString()}`)
  }, [searchParams, router])

  return null
}

export default function TablesPage() {
  return (
    <Suspense fallback={null}>
      <TablesRedirect />
    </Suspense>
  )
}
