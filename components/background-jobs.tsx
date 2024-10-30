'use client'

import { useEffect } from 'react'

export function BackgroundJobs({ hostId }: { hostId: number }) {
  useEffect(() => {
    async function callCleanApi() {
      await fetch(`/api/clean?hostId=${hostId}`)
    }
    callCleanApi()
  }, [])

  return null
}
