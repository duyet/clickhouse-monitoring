'use client'

import { HomeIcon } from 'lucide-react'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LegacyUrlRedirect } from '@/components/legacy-url-redirect'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const [showNotFound, setShowNotFound] = useState(false)

  useEffect(() => {
    // Small delay to allow redirect to happen
    const timer = setTimeout(() => setShowNotFound(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <LegacyUrlRedirect />
      {showNotFound && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          <Button asChild variant="default">
            <Link href="/">
              <HomeIcon className="mr-2 size-4" />
              Go to Home
            </Link>
          </Button>
        </div>
      )}
    </>
  )
}
