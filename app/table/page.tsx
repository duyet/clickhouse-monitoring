'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function TablePage() {
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
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
