'use client'

import { useEffect } from 'react'

export function BackgroundJobs({ hostId }: { hostId: string | number }) {
  useEffect(() => {
    const controller = new AbortController()

    async function callCleanApi() {
      try {
        const response = await fetch(`/api/clean?hostId=${hostId}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          console.error(`Clean API failed with status ${response.status}`)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Clean API error:', error.message)
        }
      }
    }

    callCleanApi()

    return () => controller.abort()
  }, [hostId])

  return null
}
