/**
 * Tests for config.ts — SWR configuration presets and utilities.
 */

import {
  createPollingConfig,
  onErrorRetry,
  REFRESH_INTERVAL,
  swrConfig,
  visibilityAwareInterval,
} from '../config'
import { beforeEach, describe, expect, it, mock } from 'bun:test'

describe('REFRESH_INTERVAL', () => {
  it('has expected interval values', () => {
    expect(REFRESH_INTERVAL.NEVER).toBe(0)
    expect(REFRESH_INTERVAL.FAST_15S).toBe(15_000)
    expect(REFRESH_INTERVAL.MEDIUM_30S).toBe(30_000)
    expect(REFRESH_INTERVAL.DEFAULT_60S).toBe(60_000)
    expect(REFRESH_INTERVAL.SLOW_2M).toBe(120_000)
    expect(REFRESH_INTERVAL.VERY_SLOW_5M).toBe(300_000)
  })

  it('all values are positive or zero', () => {
    Object.values(REFRESH_INTERVAL).forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('swrConfig presets', () => {
  it('polling15s uses FAST_15S interval', () => {
    expect(swrConfig.polling15s.refreshInterval).toBe(REFRESH_INTERVAL.FAST_15S)
  })

  it('polling30s uses MEDIUM_30S interval', () => {
    expect(swrConfig.polling30s.refreshInterval).toBe(
      REFRESH_INTERVAL.MEDIUM_30S
    )
  })

  it('polling60s uses DEFAULT_60S interval', () => {
    expect(swrConfig.polling60s.refreshInterval).toBe(
      REFRESH_INTERVAL.DEFAULT_60S
    )
  })

  it('polling2m uses SLOW_2M interval', () => {
    expect(swrConfig.polling2m.refreshInterval).toBe(REFRESH_INTERVAL.SLOW_2M)
  })

  it('polling5m uses VERY_SLOW_5M interval', () => {
    expect(swrConfig.polling5m.refreshInterval).toBe(
      REFRESH_INTERVAL.VERY_SLOW_5M
    )
  })

  it('static preset disables refresh and revalidation', () => {
    expect(swrConfig.static.refreshInterval).toBe(REFRESH_INTERVAL.NEVER)
    expect(swrConfig.static.revalidateOnFocus).toBe(false)
    expect(swrConfig.static.revalidateOnReconnect).toBe(false)
  })

  it('once preset disables all revalidation', () => {
    expect(swrConfig.once.revalidateOnFocus).toBe(false)
    expect(swrConfig.once.revalidateOnReconnect).toBe(false)
    expect(swrConfig.once.revalidateIfStale).toBe(false)
  })
})

describe('createPollingConfig', () => {
  it('returns config with given interval', () => {
    const config = createPollingConfig(REFRESH_INTERVAL.FAST_15S)
    expect(config.refreshInterval).toBe(15_000)
  })

  it('returns config with custom numeric value', () => {
    const config = createPollingConfig(REFRESH_INTERVAL.NEVER)
    expect(config.refreshInterval).toBe(0)
  })
})

describe('visibilityAwareInterval', () => {
  it('returns the given ms when document is not hidden', () => {
    // Default: document.hidden is false in test environment
    const getInterval = visibilityAwareInterval(5000)
    expect(getInterval()).toBe(5000)
  })

  it('returns 0 when document is hidden', () => {
    const originalHidden = document.hidden
    try {
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      })
      const getInterval = visibilityAwareInterval(5000)
      expect(getInterval()).toBe(0)
    } finally {
      Object.defineProperty(document, 'hidden', {
        value: originalHidden,
        configurable: true,
      })
    }
  })
})

describe('onErrorRetry', () => {
  const mockRevalidate = mock(() => {})

  beforeEach(() => {
    mockRevalidate.mockClear()
  })

  it('does not retry on 4xx errors (except 429)', () => {
    const error = new Error('Not Found') as Error & { status: number }
    error.status = 404

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 0,
    })

    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('retries on 429 rate limit errors', () => {
    const error = new Error('Too Many Requests') as Error & { status: number }
    error.status = 429

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 0,
    })

    expect(mockRevalidate).toHaveBeenCalled()
  })

  it('retries on 5xx errors', () => {
    const error = new Error('Server Error') as Error & { status: number }
    error.status = 500

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 0,
    })

    expect(mockRevalidate).toHaveBeenCalled()
  })

  it('does not retry when retryCount exceeds errorRetryCount', () => {
    const error = new Error('Network error')

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 3,
    })

    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('retries network errors (no status) with exponential backoff', () => {
    const error = new Error('Network error')

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 1,
    })

    expect(mockRevalidate).toHaveBeenCalledWith({ retryCount: 1 })
  })

  it('does not retry on 400 Bad Request', () => {
    const error = new Error('Bad Request') as Error & { status: number }
    error.status = 400

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 0,
    })

    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('does not retry on 403 Forbidden', () => {
    const error = new Error('Forbidden') as Error & { status: number }
    error.status = 403

    onErrorRetry(error, 'key', { errorRetryCount: 3 } as any, mockRevalidate, {
      retryCount: 0,
    })

    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('uses default errorRetryCount of 3 when config is undefined', () => {
    const error = new Error('Network error')

    // retryCount = 3 should hit the default limit
    onErrorRetry(error, 'key', {} as any, mockRevalidate, { retryCount: 3 })

    expect(mockRevalidate).not.toHaveBeenCalled()
  })
})
