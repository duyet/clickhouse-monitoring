'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function Background() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function callCleanApi() {
      await fetch('/api/clean')
    }
    callCleanApi()
  }, [])

  return null
}
