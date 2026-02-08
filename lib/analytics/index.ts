/**
 * Analytics Module
 * Central analytics and tracking system
 */

// Types
export type {
  AnalyticsConfig,
  AnalyticsContextValue,
  AnalyticsEvent,
  AnalyticsEventKind,
  ErrorCaughtData,
  FeatureUsageData,
  PageViewData,
  PerformanceMetricData,
  UserActionData,
} from './types'

// Client
export { AnalyticsClient, getAnalyticsClient } from './client'
// Configuration
export {
  defaultAnalyticsConfig,
  getStoredConfig,
  isDNTEnabled,
  shouldEnableAnalytics,
  storeConsent,
} from './config'
// Hooks (client-side)
export {
  useActionTracking,
  useAnalytics,
  useAnalyticsContext,
  useFeatureTracking,
  usePageViewTracking,
} from './hooks'
// Performance tracking
export { useCustomPerformance, useWebVitals } from './performance'
