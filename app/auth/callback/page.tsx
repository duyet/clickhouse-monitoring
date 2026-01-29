'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Get stored redirect intent
    const redirectTo =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('auth_redirect')
        : null

    if (redirectTo) {
      sessionStorage.removeItem('auth_redirect')
      router.push(redirectTo)
    } else {
      router.push('/overview')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
