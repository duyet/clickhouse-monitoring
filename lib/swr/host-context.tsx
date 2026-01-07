'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { createContext, type ReactNode, useContext, useMemo } from 'react'

interface HostContextValue {
  hostId: number
}

const HostContext = createContext<HostContextValue | null>(null)

/**
 * HostProvider - Provides hostId from URL query/route params via context
 *
 * This component reads search params once and provides the value via context.
 * Must be wrapped in Suspense for static page generation.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <Suspense fallback={<Loading />}>
 *   <HostProvider>
 *     {children}
 *   </HostProvider>
 * </Suspense>
 * ```
 */
export function HostProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const params = useParams()

  // Calculate hostId directly (no memo) - cheap operation that ensures
  // we always get the current value from URL params.
  // useMemo with searchParams dependency was causing stale values because
  // Next.js may return the same searchParams object reference even when
  // the URL changes, preventing recalculation.
  let hostId = 0

  // First try query param (for static routes)
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

  // Memoize the context value to prevent unnecessary re-renders
  // when hostId hasn't actually changed
  const value = useMemo(() => ({ hostId }), [hostId])

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>
}

/**
 * useHostContext - Access hostId from context (throws if not in provider)
 */
export function useHostContext(): HostContextValue {
  const context = useContext(HostContext)
  if (!context) {
    throw new Error('useHostContext must be used within a HostProvider')
  }
  return context
}

/**
 * useHostIdFromContext - Get hostId from context with graceful fallback
 *
 * During static generation (SSG), returns default value (0) if provider not available.
 * This allows pages to be statically generated with default host.
 * On client hydration, the actual hostId from URL will be used.
 */
export function useHostIdFromContext(): number {
  const context = useContext(HostContext)
  // Return default host if context not available (during SSG)
  return context?.hostId ?? 0
}
