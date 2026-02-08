'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { RedirectSkeleton } from '@/components/skeletons'

function TableRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    const host = searchParams.get('host')
    const database = searchParams.get('database')
    const table = searchParams.get('table')

    if (host) params.set('host', host)
    if (database) params.set('database', database)
    if (table) params.set('table', table)

    router.replace(`/explorer?${params.toString()}`)
  }, [searchParams, router])

  return (
    <RedirectSkeleton
      title="Loading table..."
      description="Opening table explorer..."
    />
  )
}

export default function TablePage() {
  return (
    <Suspense fallback={<RedirectSkeleton />}>
      <TableRedirect />
    </Suspense>
  )
}
