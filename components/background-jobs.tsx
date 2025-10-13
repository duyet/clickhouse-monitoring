'use client'

import { useEffect } from 'react'

export function BackgroundJobs({ hostId }: { hostId: number }) {
  useEffect(() => {
    // Create AbortController for cleanup
    const abortController = new AbortController()
    let isActive = true

    async function callCleanApi() {
      try {
        const response = await fetch(`/api/clean?hostId=${hostId}`, {
          signal: abortController.signal,
        })

        // Only process response if component is still mounted
        if (isActive && !response.ok) {
          console.error(
            '[BackgroundJobs] Clean API failed:',
            response.statusText
          )
        }
      } catch (error) {
        // Ignore abort errors (expected during cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        // Only log errors if component is still mounted
        if (isActive) {
          console.error('[BackgroundJobs] Clean API error:', error)
        }
      }
    }

    callCleanApi()

    // Cleanup function
    return () => {
      isActive = false
      abortController.abort()
    }
  }, [hostId])

  return null
}
