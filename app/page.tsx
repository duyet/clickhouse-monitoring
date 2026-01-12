'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useIsAuthenticated } from '@/lib/auth/client'

function RootContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useIsAuthenticated()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      // Redirect to login
      const callbackUrl = searchParams.get('callbackUrl') || '/overview'
      router.replace(
        `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      )
    } else {
      // Check if user has organizations, if not redirect to create organization
      router.push('/hosts')
    }
  }, [isAuthenticated, isLoading, router, searchParams])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return null
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <RootContent />
    </Suspense>
  )
}
