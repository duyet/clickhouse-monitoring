'use client'

import { useHostIdFromContext } from './host-context'

/**
 * Hook to get hostId from URL query parameters
 *
 * Expected routes:
 * - Static routes: /overview?host=0, /dashboard?host=1
 * - Dynamic routes (legacy): /[host]/[view]/page.tsx
 *
 * This hook reads from HostContext which is populated by HostProvider.
 * The HostProvider must be wrapped in Suspense for static page generation.
 *
 * @returns {number} The host ID from the URL (defaults to 0)
 *
 * @example
 * ```typescript
 * const hostId = useHostId()
 * // Returns 0 for /overview?host=0
 * // Returns 1 for /dashboard?host=1
 * ```
 */
export function useHostId(): number {
  return useHostIdFromContext()
}
