'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TablesPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/table?database=default')
  }, [router])

  return null
}
