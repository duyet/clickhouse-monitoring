'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PageView({ hostId }: { hostId: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Create AbortController for cleanup
    const abortController = new AbortController()
    let isActive = true

    async function callInit() {
      try {
        const response = await fetch(`/api/init?hostId=${hostId}`, {
          signal: abortController.signal,
        })

        // Only process response if component is still mounted
        if (isActive && !response.ok) {
          console.error('[PageView] Init API failed:', response.statusText)
        }
      } catch (error) {
        // Ignore abort errors (expected during cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        // Only log errors if component is still mounted
        if (isActive) {
          console.error('[PageView] Init API error:', error)
        }
      }
    }

    callInit()

    // Cleanup function
    return () => {
      isActive = false
      abortController.abort()
    }
  }, [hostId])

  useEffect(() => {
    // Create AbortController for cleanup
    const abortController = new AbortController()
    let isActive = true

    async function pageViewTrack() {
      try {
        const url = `${pathname}${searchParams ? '?' + searchParams.toString() : ''}`
        console.log('[PageView] Tracking:', url)

        const response = await fetch(
          '/api/pageview?' +
            new URLSearchParams({ url, hostId: hostId.toString() }).toString(),
          {
            signal: abortController.signal,
          }
        )

        // Only process response if component is still mounted
        if (isActive && !response.ok) {
          console.error('[PageView] PageView API failed:', response.statusText)
        }
      } catch (error) {
        // Ignore abort errors (expected during cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        // Only log errors if component is still mounted
        if (isActive) {
          console.error('[PageView] PageView API error:', error)
        }
      }
    }

    pageViewTrack()

    // Cleanup function
    return () => {
      isActive = false
      abortController.abort()
    }
  }, [pathname, searchParams, hostId])

  return null
}
