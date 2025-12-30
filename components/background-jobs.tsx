'use client'

import { memo, useEffect } from 'react'

export const BackgroundJobs = memo(function BackgroundJobs({ hostId }: { hostId: string | number }) {
  useEffect(() => {
    async function callCleanApi() {
      await fetch(`/api/clean?hostId=${hostId}`)
    }
    callCleanApi()
  }, [hostId])

  return null
})
