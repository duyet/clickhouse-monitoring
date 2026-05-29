'use client'

import useSWR from 'swr'

import { useEffect } from 'react'

const BASE_TITLE = 'ClickHouse Monitoring'
const WARNING_PREFIX = '⚠️ '

interface HealthzResponse {
  ok: boolean
  hosts?: Array<{ status: 'up' | 'down' }>
}

const fetcher = (url: string): Promise<HealthzResponse> =>
  fetch(url).then((r) => r.json() as Promise<HealthzResponse>)

/**
 * Updates document.title with a warning prefix when ClickHouse hosts are
 * unreachable. Polls /api/healthz every 60 seconds.
 *
 * Renders nothing — side-effect only.
 */
export function DynamicTitle() {
  const { data } = useSWR<HealthzResponse>('/api/healthz', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    // Don't retry aggressively on errors — network issues will surface naturally
    errorRetryCount: 2,
  })

  useEffect(() => {
    if (data === undefined) {
      // Still loading — leave title as-is
      return
    }

    const isDegraded = data.ok === false

    document.title = isDegraded ? `${WARNING_PREFIX}${BASE_TITLE}` : BASE_TITLE

    return () => {
      // Reset on unmount (e.g. layout teardown)
      document.title = BASE_TITLE
    }
  }, [data])

  return null
}
