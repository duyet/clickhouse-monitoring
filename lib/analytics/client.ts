/**
 * Analytics Client
 * Handles event batching, queuing, and transmission to the backend
 */

import type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsEventKind,
  ErrorCaughtData,
  FeatureUsageData,
  PageViewData,
  PerformanceMetricData,
  UserActionData,
} from './types'

interface QueuedEvent extends AnalyticsEvent {
  retryCount?: number
}

/**
 * Analytics client for event tracking
 */
export class AnalyticsClient {
  private queue: QueuedEvent[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private isOnline = true

  constructor(private config: AnalyticsConfig) {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)

      // Flush queue on page unload
      window.addEventListener('beforeunload', () => this.flush(true))

      // Flush queue on visibility change (user leaves tab)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true)
        }
      })
    }
  }

  /**
   * Track a generic analytics event
   */
  track(kind: AnalyticsEventKind, data: unknown): void {
    const event: AnalyticsEvent = {
      kind,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      event_time: new Date(),
      event_date: new Date(),
    }

    this.addToQueue(event)
  }

  /**
   * Track a page view
   */
  trackPageView(data: PageViewData): void {
    this.track('PageView', data)
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(data: FeatureUsageData): void {
    this.track('FeatureUsage', data)
  }

  /**
   * Track an error
   */
  trackError(error: Error | ErrorCaughtData): void {
    const data: ErrorCaughtData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            type: error.name,
          }
        : error

    this.track('ErrorCaught', data)
  }

  /**
   * Track a performance metric
   */
  trackPerformance(data: PerformanceMetricData): void {
    if (!this.config.trackPerformance) return
    this.track('PerformanceMetric', data)
  }

  /**
   * Track a user action
   */
  trackUserAction(data: UserActionData): void {
    this.track('UserAction', data)
  }

  /**
   * Add event to queue and trigger flush if needed
   */
  private addToQueue(event: AnalyticsEvent): void {
    this.queue.push(event)

    if (this.queue.length >= this.config.batchSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flush()
      this.flushTimer = null
    }, this.config.flushInterval)
  }

  /**
   * Flush queued events to the server
   */
  private async flush(sync = false): Promise<void> {
    if (this.queue.length === 0) return

    const eventsToSend = [...this.queue]
    this.queue = []

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    try {
      const method = sync ? 'sendBeacon' : 'fetch'

      if (
        method === 'sendBeacon' &&
        typeof navigator.sendBeacon === 'function'
      ) {
        // Use sendBeacon for sync requests (unloading page)
        const blob = new Blob([JSON.stringify({ events: eventsToSend })], {
          type: 'application/json',
        })
        navigator.sendBeacon(this.config.apiEndpoint, blob)
      } else {
        // Use fetch for async requests
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: eventsToSend }),
          keepalive: sync,
        })
      }
    } catch (error) {
      // Re-queue events for retry
      eventsToSend.forEach((event) => {
        this.queue.push({
          ...event,
          retryCount: (event.retryCount || 0) + 1,
        })
      })

      // Only log error, don't throw
      console.error('[Analytics] Failed to send events:', error)
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.isOnline = true
    this.flush()
  }

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flush(true)
  }
}

/**
 * Create a singleton analytics client instance
 */
let clientInstance: AnalyticsClient | null = null

export function getAnalyticsClient(config?: AnalyticsConfig): AnalyticsClient {
  if (!clientInstance && config) {
    clientInstance = new AnalyticsClient(config)
  }

  return clientInstance!
}
