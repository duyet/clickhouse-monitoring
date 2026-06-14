import { createFileRoute } from '@tanstack/react-router'

import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'
import { useRouter } from '@/lib/next-compat'
import { pageOgHead } from '@/lib/og'

function TablesPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/table?database=default')
  }, [router])

  return <PageSkeleton />
}

export const Route = createFileRoute('/(dashboard)/tables')({
  component: TablesPage,
  head: () => pageOgHead('tables'),
})
