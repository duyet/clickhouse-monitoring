import { createFileRoute } from '@tanstack/react-router'

import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'
import { useRouter } from '@/lib/next-compat'

export const Route = createFileRoute('/')({
  component: Home,
})

// Root page — client-side redirect to /overview?host=0, mirroring the Next
// app's app/(dashboard)/page.tsx. Fully static SPA: no server redirect.
function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/overview?host=0')
  }, [router])

  return <PageSkeleton />
}
