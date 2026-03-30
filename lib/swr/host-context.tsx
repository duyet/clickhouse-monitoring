'use client'

import { createContext, type ReactNode, useContext, useMemo } from 'react'

interface HostContextValue {
  hostId: number
}

const HostContext = createContext<HostContextValue | null>(null)

/**
 * HostProvider - Provides hostId via context
 *
 * Accept hostId as a prop. If not provided, falls back to 0.
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
export function HostProvider({
  hostId = 0,
  children,
}: {
  hostId?: number
  children: ReactNode
}) {
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
