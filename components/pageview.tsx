'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PageView({ hostId }: { hostId: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize once on mount
  useEffect(() => {
    let isMounted = true

    async function callInit() {
      try {
        const response = await fetch(`/api/init?hostId=${hostId}`)
        if (!response.ok && isMounted) {
          console.error('Init API failed:', response.statusText)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Init API error:', error)
        }
      }
    }
    callInit()

    return () => {
      isMounted = false
    }
  }, [hostId])

  // Track page views
  useEffect(() => {
    let isMounted = true

    async function pageViewTrack() {
      const url = `${pathname}${searchParams ? '?' + searchParams.toString() : ''}`
      console.log('PageView', url)
      try {
        const response = await fetch(
          '/api/pageview?' +
            new URLSearchParams({ url, hostId: hostId.toString() }).toString()
        )
        if (!response.ok && isMounted) {
          console.error('PageView API failed:', response.statusText)
        }
      } catch (error) {
        if (isMounted) {
          console.error('PageView API error:', error)
        }
      }
    }

    pageViewTrack()

    return () => {
      isMounted = false
    }
  }, [pathname, searchParams, hostId])

  return null
}
