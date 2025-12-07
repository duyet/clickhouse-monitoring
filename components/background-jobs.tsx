'use client'

import { useEffect } from 'react'

export function BackgroundJobs({ hostId }: { hostId: string | number }) {
  useEffect(() => {
    async function callCleanApi() {
      await fetch(`/api/clean?hostId=${hostId}`)
    }
    callCleanApi()
  }, [hostId])

  return null
}
