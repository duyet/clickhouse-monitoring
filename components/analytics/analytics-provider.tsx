/**
 * Analytics Provider
 * Provides analytics context to the app and initializes tracking
 */

'use client'

import type { ReactNode } from 'react'
import type { AnalyticsContextValue } from '@/lib/analytics/types'

import { createContext, useContext, useEffect, useMemo } from 'react'
import { useAnalytics } from '@/lib/analytics/hooks'
import { useCustomPerformance, useWebVitals } from '@/lib/analytics/performance'

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
  enablePageViewTracking?: boolean
  enablePerformanceTracking?: boolean
  enableErrorTracking?: boolean
}

/**
 * Analytics Provider Component
 * Wraps the app to provide analytics functionality
 */
export function AnalyticsProvider({
  children,
  enablePageViewTracking = true,
  enablePerformanceTracking = true,
  enableErrorTracking = true,
}: AnalyticsProviderProps) {
  const analytics = useAnalytics()

  // Initialize performance tracking
  useWebVitals()
  useCustomPerformance()

  // Initialize error tracking
  useEffect(() => {
    if (!analytics.hasConsent || !enableErrorTracking) return

    // Track unhandled errors
    const handleError = (event: ErrorEvent) => {
      analytics.trackError({
        message: event.message,
        stack: event.error?.stack,
        type: 'UnhandledError',
        url: event.filename,
        line: event.lineno,
        column: event.colno,
      })
    }

    // Track unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError({
        message: String(event.reason),
        type: 'UnhandledRejection',
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [analytics, enableErrorTracking])

  // Track initial page view
  useEffect(() => {
    if (!analytics.hasConsent || !enablePageViewTracking) return

    analytics.trackPageView({
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
    })
  }, [analytics, enablePageViewTracking])

  // Track route changes for client-side navigation
  useEffect(() => {
    if (!analytics.hasConsent || !enablePageViewTracking) return

    // Use MutationObserver to detect page content changes
    // This is a workaround since Next.js App Router doesn't expose route change events
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'childList' &&
          mutation.target === document.body
        ) {
          // Check if title changed (indicates route change)
          if (
            mutation.addedNodes.length > 0 ||
            mutation.removedNodes.length > 0
          ) {
            const currentPath = window.location.pathname
            const currentTitle = document.title

            // Debounce to avoid multiple tracking calls
            setTimeout(() => {
              if (
                window.location.pathname === currentPath &&
                document.title === currentTitle
              ) {
                analytics.trackPageView({
                  url: window.location.href,
                  path: window.location.pathname,
                  title: document.title,
                })
              }
            }, 100)
          }
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: false,
    })

    return () => {
      observer.disconnect()
    }
  }, [analytics, enablePageViewTracking])

  const contextValue = useMemo(() => analytics, [analytics])

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

/**
 * Hook to use analytics context
 */
export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext)

  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider')
  }

  return context
}
