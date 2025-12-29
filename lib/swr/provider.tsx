'use client'

import { SWRConfig, type SWRConfiguration } from 'swr'
import type React from 'react'

/**
 * Global SWR fetcher function
 * Handles JSON responses from fetch calls
 */
const globalFetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error(`Failed to fetch data: ${res.statusText}`)
    throw error
  }

  return res.json()
}

/**
 * SWR provider configuration with sensible defaults
 * - revalidateOnFocus: false - Don't refetch when window regains focus
 * - dedupingInterval: 5000ms - Deduplicate requests within 5 seconds
 * - errorRetryCount: 3 - Retry failed requests up to 3 times
 * - errorRetryInterval: 1000ms - Wait 1 second between retries
 */
const swrConfig: SWRConfiguration = {
  fetcher: globalFetcher,
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
}

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * SWR Provider wrapper component
 * Provides global SWR configuration to all SWR hooks in the app
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
