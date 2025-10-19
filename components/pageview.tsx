'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PageView({ hostId }: { hostId: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize once on mount
  useEffect(() => {
    const abortController = new AbortController()

    async function callInit() {
      try {
        const response = await fetch(`/api/init?hostId=${hostId}`, {
          signal: abortController.signal,
        })
        if (!response.ok) {
          console.error('Init API failed:', response.statusText)
        }
      } catch (error) {
        // Ignore AbortError when component unmounts
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Init API error:', error)
        }
      }
    }
    callInit()

    return () => {
      abortController.abort()
    }
  }, [hostId])

  // Track page views
  useEffect(() => {
    const abortController = new AbortController()

    async function pageViewTrack() {
      const url = `${pathname}${searchParams ? '?' + searchParams.toString() : ''}`
      console.log('PageView', url)
      try {
        const response = await fetch(
          '/api/pageview?' +
            new URLSearchParams({ url, hostId: hostId.toString() }).toString(),
          {
            signal: abortController.signal,
          }
        )
        if (!response.ok) {
          console.error('PageView API failed:', response.statusText)
        }
      } catch (error) {
        // Ignore AbortError when component unmounts
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('PageView API error:', error)
        }
      }
    }

    pageViewTrack()

    return () => {
      abortController.abort()
    }
  }, [pathname, searchParams, hostId])

  return null
}
