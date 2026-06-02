'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'

/**
 * Redirect page for legacy /ai-chat route
 * Redirects to the new /agents route
 */
export default function AiChatRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/agents')
  }, [router])

  return <PageSkeleton />
}
