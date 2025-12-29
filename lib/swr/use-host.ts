'use client'

import { useParams } from 'next/navigation'

/**
 * Hook to extract hostId from URL parameters
 * Expected route: /[host]/[view]/page.tsx
 * Returns the host parameter as a number
 *
 * @returns {number} The host ID from the URL parameter
 * @throws {Error} If host parameter is missing or invalid
 *
 * @example
 * ```typescript
 * const hostId = useHostId()
 * ```
 */
export function useHostId(): number {
  const params = useParams()

  if (!params.host) {
    throw new Error('useHostId: host parameter is missing from URL')
  }

  const host = params.host

  // Handle both string and string array (from dynamic routes)
  const hostString = Array.isArray(host) ? host[0] : host

  const hostId = Number(hostString)

  if (Number.isNaN(hostId)) {
    throw new Error(`useHostId: invalid host parameter "${hostString}"`)
  }

  return hostId
}
