'use client'

import { useEffect } from 'react'

export function BackgroundJobs({ hostId }: { hostId: number }) {
  useEffect(() => {
    async function callCleanApi() {
      try {
        const response = await fetch(`/api/clean?hostId=${hostId}`)
        if (!response.ok) {
          console.error('Clean API failed:', response.statusText)
        }
      } catch (error) {
        console.error('Clean API error:', error)
      }
    }
    callCleanApi()
  }, [hostId])

  return null
}
