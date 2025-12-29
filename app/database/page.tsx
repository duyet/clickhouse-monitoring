'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function DatabasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hostId = searchParams.get('host') || '0'

  // Redirect to the default database
  router.push(`/database/default?host=${hostId}`)

  return null
}
