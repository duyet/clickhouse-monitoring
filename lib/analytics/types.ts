/**
 * Analytics Types
 * Types for analytics events and tracking configuration
 */

/**
 * Supported analytics event kinds
 * Extends the existing system.monitoring_events kind Enum
 */
export type AnalyticsEventKind =
  | 'PageView'
  | 'FeatureUsage'
  | 'ErrorCaught'
  | 'PerformanceMetric'
  | 'UserAction'
  | 'UserKillQuery'
  | 'SystemKillQuery'
  | 'LastCleanup'

/**
 * Base analytics event interface
 */
export interface AnalyticsEvent {
  kind: AnalyticsEventKind
  actor?: string
  data: string // Primary event data
  extra?: string // Additional metadata (JSON)
  event_time?: Date
  event_date?: Date
}

/**
 * Page view event data
 */
export interface PageViewData {
  url: string
  path: string
  title?: string
  referrer?: string
  hostId?: number
}

/**
 * Feature usage event data
 */
export interface FeatureUsageData {
  feature: string // e.g., 'chart-view', 'table-view', 'query-kill'
  action?: string // e.g., 'open', 'close', 'refresh'
  metadata?: Record<string, unknown>
}

/**
 * Error caught event data
 */
export interface ErrorCaughtData {
  message: string
  stack?: string
  type?: string
  url?: string
  line?: number
  column?: number
  componentName?: string
}

/**
 * Performance metric event data
 */
export interface PerformanceMetricData {
  name: string // e.g., 'FCP', 'LCP', 'CLS', 'FID', 'TTFB'
  value: number // Metric value in milliseconds
  rating?: 'good' | 'needs-improvement' | 'poor'
  url?: string
}

/**
 * User action event data
 */
export interface UserActionData {
  action: string // e.g., 'click', 'submit', 'toggle'
  target: string // e.g., 'button-id', 'form-name'
  context?: string // e.g., 'header', 'sidebar', 'chart'
  metadata?: Record<string, unknown>
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean
  respectDNT: boolean
  anonymizeIP: boolean
  trackPerformance: boolean
  trackErrors: boolean
  trackPageViews: boolean
  apiEndpoint: string
  batchSize: number
  flushInterval: number // milliseconds
  hasConsent?: boolean // User consent for analytics
}

/**
 * Analytics context for hooks
 */
export interface AnalyticsContextValue {
  config: AnalyticsConfig
  hasConsent: boolean
  setConsent: (consent: boolean) => void
  trackEvent: (kind: AnalyticsEventKind, data: unknown) => void
  trackPageView: (data: PageViewData) => void
  trackFeatureUsage: (data: FeatureUsageData) => void
  trackError: (error: Error | ErrorCaughtData) => void
  trackPerformance: (data: PerformanceMetricData) => void
  trackUserAction: (data: UserActionData) => void
}
