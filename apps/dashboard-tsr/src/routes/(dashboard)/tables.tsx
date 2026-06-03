import { createFileRoute } from '@tanstack/react-router'
import { useRouter } from '@/lib/next-compat'
import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'

function TablesPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/table?database=default')
  }, [router])

  return <PageSkeleton />
}


export const Route = createFileRoute('/(dashboard)/tables')({
  component: TablesPage,
})
