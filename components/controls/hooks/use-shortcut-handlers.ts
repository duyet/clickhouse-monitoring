/**
 * Shortcut handler hooks for keyboard navigation
 *
 * Provides navigation handlers for keyboard shortcuts.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useHostId } from '@/lib/swr'
import { buildUrl } from '@/lib/url/url-builder'

/**
 * Navigation handlers for keyboard shortcuts
 */
export function useShortcutHandlers() {
  const router = useRouter()
  const hostId = useHostId()

  const goToOverview = useCallback(() => {
    router.push(buildUrl('/overview', { host: hostId }))
  }, [router, hostId])

  const goToQueries = useCallback(() => {
    router.push(buildUrl('/running-queries', { host: hostId }))
  }, [router, hostId])

  const goToTables = useCallback(() => {
    router.push(buildUrl('/tables', { host: hostId }))
  }, [router, hostId])

  const triggerRevalidate = useCallback(() => {
    // Trigger SWR revalidation by dispatching a custom event
    window.dispatchEvent(new CustomEvent('swr:revalidate'))
  }, [])

  return {
    goToOverview,
    goToQueries,
    goToTables,
    triggerRevalidate,
  }
}
