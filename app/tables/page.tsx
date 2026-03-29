'use client'

export const dynamic = 'force-static'

import { useRouter } from 'next/navigation'

export default function TablesPage() {
  const router = useRouter()

  // Redirect to the default database
  router.push('/table?database=default')

  return null
}
