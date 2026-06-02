/**
 * Hook for SWR revalidation from keyboard shortcuts
 *
 * Components can listen for the 'swr:revalidate' event to refresh their data.
 *
 * @example
 * ```tsx
 * import { useSWRRevalidate } from '@/components/controls/hooks/use-swr-revalidate'
 *
 * export function MyComponent() {
 *   useSWRRevalidate(mutate)
 *   // ...
 * }
 * ```
 */

'use client'

import { useEffect } from 'react'

export function useSWRRevalidate(mutate: () => Promise<unknown> | undefined) {
  useEffect(() => {
    const handleRevalidate = () => {
      void mutate()
    }

    window.addEventListener('swr:revalidate', handleRevalidate)
    return () => {
      window.removeEventListener('swr:revalidate', handleRevalidate)
    }
  }, [mutate])
}
