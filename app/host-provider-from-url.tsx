'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { HostProvider } from '@/lib/swr'

/**
 * HostProviderFromUrl - Reads hostId from URL params and passes to HostProvider
 *
 * This is the app-layer adapter that connects Next.js routing to the
 * framework-agnostic HostProvider. At migration time, only this file
 * needs to change (swap useSearchParams to TanStack's useSearch).
 */
export function HostProviderFromUrl({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const params = useParams()

  let hostId = 0

  // First try query param (for static routes: ?host=0)
  const hostParam = searchParams.get('host')
  if (hostParam !== null) {
    const parsed = Number(hostParam)
    if (!Number.isNaN(parsed)) {
      hostId = parsed
    }
  } else {
    // Fallback to route param (for dynamic routes, legacy support)
    if (params.host) {
      const host = params.host
      const hostString = Array.isArray(host) ? host[0] : host
      const hostNum = Number(hostString)
      if (!Number.isNaN(hostNum)) {
        hostId = hostNum
      }
    }
  }

  return <HostProvider hostId={hostId}>{children}</HostProvider>
}
