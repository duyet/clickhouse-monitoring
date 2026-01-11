'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthState } from '@/lib/auth/client'

/**
 * Root page - redirect based on auth status
 *
 * Redirects to auth flow if not authenticated, or to dashboard if authenticated
 */
export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthState()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return null
}
