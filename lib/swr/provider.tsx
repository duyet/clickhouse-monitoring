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
 * Differentiated retry logic based on error type
 * - Don't retry: 404 (not found), 403 (permission), 400 (validation)
 * - Retry: 503 (service unavailable), 502 (bad gateway), network errors
 */
const onErrorRetry: SWRConfiguration['onErrorRetry'] = (
  error,
  key,
  config,
  revalidate,
  { retryCount }
) => {
  // Don't retry on 4xx client errors (except 429)
  if ('status' in error && typeof error.status === 'number') {
    const status = error.status
    if (status >= 400 && status < 500 && status !== 429) {
      return
    }
  }

  // Don't retry if we've exceeded the max retry count
  if (retryCount >= (config.errorRetryCount || 3)) {
    return
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  const retryDelay = Math.min(1000 * 2 ** retryCount, 30000)

  setTimeout(() => revalidate({ retryCount }), retryDelay)
}

/**
 * Global error logging for SWR
 */
const onError: SWRConfiguration['onError'] = (error, key) => {
  // Log SWR errors to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[SWR Error] ${key}:`, error)
  }
}

/**
 * SWR provider configuration with sensible defaults
 * - revalidateOnFocus: false - Don't refetch when window regains focus
 * - dedupingInterval: 5000ms - Deduplicate requests within 5 seconds
 * - errorRetryCount: 3 - Retry failed requests up to 3 times
 * - onErrorRetry: Custom retry logic with exponential backoff
 */
const swrConfig: SWRConfiguration = {
  fetcher: globalFetcher,
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  onErrorRetry,
  onError,
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
