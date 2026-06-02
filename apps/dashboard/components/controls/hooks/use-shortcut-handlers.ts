/**
 * Shortcut handler hooks for keyboard navigation
 *
 * Provides navigation handlers for keyboard shortcuts.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useHostId } from '@/lib/swr'
import { buildUrl } from '@/lib/url/url-builder'

/**
 * Navigation handlers for keyboard shortcuts
 */
export function useShortcutHandlers() {
  const router = useRouter()
  const hostId = useHostId()

  const goToOverview = () => {
    router.push(buildUrl('/overview', { host: hostId }))
  }

  const goToQueries = () => {
    router.push(buildUrl('/running-queries', { host: hostId }))
  }

  const goToTables = () => {
    router.push(buildUrl('/tables', { host: hostId }))
  }

  const triggerRevalidate = () => {
    // Trigger SWR revalidation by dispatching a custom event
    window.dispatchEvent(new CustomEvent('swr:revalidate'))
  }

  return {
    goToOverview,
    goToQueries,
    goToTables,
    triggerRevalidate,
  }
}
