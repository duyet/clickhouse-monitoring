'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PageView({ hostId }: { hostId: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function callInit() {
      await fetch(`/api/init?hostId=${hostId}`)
    }
    callInit()
  }, [hostId])

  useEffect(() => {
    async function pageViewTrack() {
      const url = `${pathname}${searchParams ? '?' + searchParams.toString() : ''}`
      await fetch(
        '/api/pageview?' +
          new URLSearchParams({ url, hostId: hostId.toString() }).toString()
      )
    }

    pageViewTrack()
  }, [pathname, searchParams, hostId])

  return null
}
