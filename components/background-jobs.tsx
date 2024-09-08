'use client'

import { useEffect } from 'react'

export function BackgroundJobs() {
  useEffect(() => {
    async function callCleanApi() {
      await fetch('/api/clean')
    }
    callCleanApi()
  }, [])

  return null
}
