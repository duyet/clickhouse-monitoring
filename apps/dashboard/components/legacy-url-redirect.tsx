'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Detects and redirects from legacy URL format:
 * Old: /{hostId}/{route}?{existingParams}
 * New: /{route}?host={hostId}&{existingParams}
 *
 * Handles ALL routes matching /{number}/{path} pattern.
 * Preserves existing query parameters while adding host param.
 */
export function LegacyUrlRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Pattern: /{number}/{anything}
    const legacyMatch = pathname.match(/^\/(\d+)\/(.+)$/)

    if (legacyMatch) {
      const [, hostId, route] = legacyMatch

      // Preserve existing query params
      const params = new URLSearchParams(searchParams.toString())
      params.set('host', hostId)

      const queryString = params.toString()
      const newUrl = `/${route}${queryString ? `?${queryString}` : ''}`

      router.replace(newUrl)
    }
  }, [pathname, searchParams, router])

  return null
}
