import { createFileRoute } from '@tanstack/react-router'

import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'
import { useRouter } from '@/lib/next-compat'

/**
 * Redirect page for legacy /ai-chat route.
 * Redirects to the new /agents route.
 */
function AiChatRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/agents')
  }, [router])

  return <PageSkeleton />
}

export const Route = createFileRoute('/(dashboard)/ai-chat')({
  component: AiChatRedirectPage,
})
