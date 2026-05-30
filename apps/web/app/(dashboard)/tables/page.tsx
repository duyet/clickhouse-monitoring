'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'

export default function TablesPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/table?database=default')
  }, [router])

  return <PageSkeleton />
}
