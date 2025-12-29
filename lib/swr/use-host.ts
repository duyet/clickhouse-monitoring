'use client'

import { useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'

/**
 * Hook to extract hostId from URL query parameters or route parameters
 * Expected routes:
 * - Static routes: /overview?host=0, /dashboard?host=1
 * - Dynamic routes (legacy): /[host]/[view]/page.tsx
 *
 * Priority:
 * 1. Query parameter `host` (for static routes)
 * 2. Route parameter `host` (for dynamic routes, legacy support)
 * 3. Default: 0
 *
 * @returns {number} The host ID from the URL
 *
 * @example
 * ```typescript
 * const hostId = useHostId()
 * // Returns 0 for /overview?host=0
 * // Returns 1 for /dashboard?host=1
 * // Returns 2 for /2/overview (legacy dynamic route)
 * ```
 */
export function useHostId(): number {
  const searchParams = useSearchParams()
  const params = useParams()

  // First try query param (for static routes)
  const hostParam = searchParams.get('host')
  if (hostParam !== null) {
    const parsed = Number(hostParam)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  // Fallback to route param (for dynamic routes, legacy support)
  if (params.host) {
    const host = params.host
    const hostString = Array.isArray(host) ? host[0] : host
    const hostId = Number(hostString)
    if (!Number.isNaN(hostId)) {
      return hostId
    }
  }

  // Default to first host
  return 0
}
