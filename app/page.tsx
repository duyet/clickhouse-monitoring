'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth/client'

/**
 * Root page - redirects based on authentication status
 *
 * If authenticated: redirect to /overview?host=0
 * If not authenticated: redirect to /auth/login
 */
export default function Home() {
  const router = useRouter()
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (isLoading) return

    if (session) {
      // User is authenticated, redirect to dashboard
      router.replace('/overview?host=0')
    } else {
      // User is not authenticated, redirect to login
      router.replace('/auth/login')
    }
  }, [router, session, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}
