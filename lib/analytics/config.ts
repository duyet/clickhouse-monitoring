/**
 * Analytics Configuration
 * Central configuration for analytics behavior
 */

import type { AnalyticsConfig } from './types'

/**
 * Default analytics configuration
 * Respects environment variables and user preferences
 */
export const defaultAnalyticsConfig: AnalyticsConfig = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
  respectDNT: true,
  anonymizeIP: process.env.NEXT_PUBLIC_ANALYTICS_ANONYMIZE_IP === 'true',
  trackPerformance:
    process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PERFORMANCE !== 'false',
  trackErrors: process.env.NEXT_PUBLIC_ANALYTICS_TRACK_ERRORS !== 'false',
  trackPageViews: process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PAGEVIEWS !== 'false',
  apiEndpoint: '/api/analytics',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
}

/**
 * Get analytics config from localStorage
 */
export function getStoredConfig(): Partial<AnalyticsConfig> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem('analytics-consent')
    if (stored) {
      return { hasConsent: stored === 'true' }
    }
  } catch {
    // localStorage not available
  }

  return {}
}

/**
 * Store analytics consent preference
 */
export function storeConsent(hasConsent: boolean): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('analytics-consent', String(hasConsent))
  } catch {
    // localStorage not available
  }
}

/**
 * Check if Do Not Track is enabled
 */
export function isDNTEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  return (
    (navigator as { doNotTrack?: string }).doNotTrack === '1' ||
    (window as { doNotTrack?: string }).doNotTrack === '1' ||
    (navigator as { msDoNotTrack?: string }).msDoNotTrack === '1'
  )
}

/**
 * Determine if analytics should be enabled
 */
export function shouldEnableAnalytics(
  config: AnalyticsConfig,
  hasConsent: boolean
): boolean {
  if (!config.enabled) return false
  if (config.respectDNT && isDNTEnabled()) return false
  return hasConsent
}
