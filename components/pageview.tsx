'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function PageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function callInit() {
      await fetch('/api/init')
    }
    callInit()
  }, [])

  useEffect(() => {
    async function pageViewTrack() {
      const url = `${pathname}${searchParams ? '?' + searchParams.toString() : ''}`
      console.log('PageView', url)
      await fetch('/api/pageview?' + new URLSearchParams({ url }).toString())
    }

    pageViewTrack()
  }, [pathname, searchParams])

  return null
}
