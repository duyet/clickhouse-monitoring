/**
 * Analytics Hooks
 * React hooks for analytics tracking
 */

'use client'

import type {
  AnalyticsContextValue,
  AnalyticsEventKind,
  ErrorCaughtData,
  FeatureUsageData,
  PageViewData,
  PerformanceMetricData,
  UserActionData,
} from './types'

import { AnalyticsClient } from './client'
import { defaultAnalyticsConfig, getStoredConfig, storeConsent } from './config'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Analytics Context
 */
const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

/**
 * Hook to access analytics context
 */
export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider')
  }
  return context
}

/**
 * Analytics Provider Context
 */
export function useAnalytics(): AnalyticsContextValue {
  const [hasConsent, setConsentState] = useState(false)
  const [client, setClient] = useState<AnalyticsClient | null>(null)

  // Initialize client on mount
  useEffect(() => {
    // Check stored consent
    const stored = getStoredConfig()
    const initialConsent = stored.hasConsent ?? true // Default to true for internal tool
    setConsentState(initialConsent)

    // Create analytics client
    const analyticsClient = new AnalyticsClient(defaultAnalyticsConfig)
    setClient(analyticsClient)

    return () => {
      analyticsClient.destroy()
    }
  }, [])

  // Update consent preference
  const setConsent = (consent: boolean) => {
    setConsentState(consent)
    storeConsent(consent)
  }

  // Tracking methods
  const trackEvent = (kind: AnalyticsEventKind, data: unknown) => {
    if (!client || !hasConsent) return
    client.track(kind, data)
  }

  const trackPageView = (data: PageViewData) => {
    if (!client || !hasConsent || !defaultAnalyticsConfig.trackPageViews) return
    client.trackPageView(data)
  }

  const trackFeatureUsage = (data: FeatureUsageData) => {
    if (!client || !hasConsent) return
    client.trackFeatureUsage(data)
  }

  const trackError = (error: Error | ErrorCaughtData) => {
    if (!client || !hasConsent || !defaultAnalyticsConfig.trackErrors) return
    client.trackError(error)
  }

  const trackPerformance = (data: PerformanceMetricData) => {
    if (!client || !hasConsent) return
    client.trackPerformance(data)
  }

  const trackUserAction = (data: UserActionData) => {
    if (!client || !hasConsent) return
    client.trackUserAction(data)
  }

  return useMemo(
    () => ({
      config: defaultAnalyticsConfig,
      hasConsent,
      setConsent,
      trackEvent,
      trackPageView,
      trackFeatureUsage,
      trackError,
      trackPerformance,
      trackUserAction,
    }),
    [hasConsent, client]
  )
}

/**
 * Track page views on route changes
 * Call this in your root layout or main page component
 */
export function usePageViewTracking(): void {
  const analytics = useAnalytics()

  useEffect(() => {
    if (!analytics.hasConsent || !defaultAnalyticsConfig.trackPageViews) return

    const trackView = () => {
      analytics.trackPageView({
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
      })
    }

    // Track initial view
    trackView()

    // Track route changes (for client-side navigation)
    // Note: Next.js App Router doesn't have a simple route change event
    // You may need to integrate this with your router
  }, [analytics])
}

/**
 * Track feature usage
 * Call this when a feature is accessed
 */
export function useFeatureTracking(feature: string) {
  const analytics = useAnalytics()

  useEffect(() => {
    if (!analytics.hasConsent) return

    analytics.trackFeatureUsage({
      feature,
      action: 'open',
    })

    return () => {
      analytics.trackFeatureUsage({
        feature,
        action: 'close',
      })
    }
  }, [analytics, feature])
}

/**
 * Track user actions
 * Call this when user performs an action
 */
export function useActionTracking() {
  const analytics = useAnalytics()

  const trackAction = (action: string, target: string, context?: string) => {
    if (!analytics.hasConsent) return

    analytics.trackUserAction({
      action,
      target,
      context,
    })
  }

  return { trackAction }
}
