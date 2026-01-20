import { describe, expect, it } from 'bun:test'

import {
  REFRESH_INTERVAL,
  createPollingConfig,
  swrConfig,
  type RefreshInterval,
} from './config'

describe('REFRESH_INTERVAL', () => {
  it('should have correct millisecond values', () => {
    expect(REFRESH_INTERVAL.NEVER).toBe(0)
    expect(REFRESH_INTERVAL.FAST_15S).toBe(15_000)
    expect(REFRESH_INTERVAL.MEDIUM_30S).toBe(30_000)
    expect(REFRESH_INTERVAL.DEFAULT_60S).toBe(60_000)
    expect(REFRESH_INTERVAL.SLOW_2M).toBe(120_000)
    expect(REFRESH_INTERVAL.VERY_SLOW_5M).toBe(300_000)
  })

  it('should have readable constant names', () => {
    expect(REFRESH_INTERVAL.NEVER).toBe(0)
    expect(REFRESH_INTERVAL.FAST_15S).toBe(15_000)
    expect(REFRESH_INTERVAL.MEDIUM_30S).toBe(30_000)
    expect(REFRESH_INTERVAL.DEFAULT_60S).toBe(60_000)
    expect(REFRESH_INTERVAL.SLOW_2M).toBe(120_000)
    expect(REFRESH_INTERVAL.VERY_SLOW_5M).toBe(300_000)
  })
})

describe('swrConfig presets', () => {
  describe('polling15s preset', () => {
    it('should use FAST_15S interval', () => {
      expect(swrConfig.polling15s.refreshInterval).toBe(REFRESH_INTERVAL.FAST_15S)
    })
  })

  describe('polling30s preset', () => {
    it('should use MEDIUM_30S interval', () => {
      expect(swrConfig.polling30s.refreshInterval).toBe(REFRESH_INTERVAL.MEDIUM_30S)
    })
  })

  describe('polling60s preset', () => {
    it('should use DEFAULT_60S interval', () => {
      expect(swrConfig.polling60s.refreshInterval).toBe(REFRESH_INTERVAL.DEFAULT_60S)
    })
  })

  describe('polling2m preset', () => {
    it('should use SLOW_2M interval', () => {
      expect(swrConfig.polling2m.refreshInterval).toBe(REFRESH_INTERVAL.SLOW_2M)
    })
  })

  describe('polling5m preset', () => {
    it('should use VERY_SLOW_5M interval', () => {
      expect(swrConfig.polling5m.refreshInterval).toBe(REFRESH_INTERVAL.VERY_SLOW_5M)
    })
  })

  describe('static preset', () => {
    it('should use NEVER interval', () => {
      expect(swrConfig.static.refreshInterval).toBe(REFRESH_INTERVAL.NEVER)
    })

    it('should set revalidateOnFocus to false', () => {
      expect(swrConfig.static.revalidateOnFocus).toBe(false)
    })

    it('should set revalidateOnReconnect to false', () => {
      expect(swrConfig.static.revalidateOnReconnect).toBe(false)
    })
  })

  describe('once preset', () => {
    it('should use NEVER interval', () => {
      expect(swrConfig.once.refreshInterval).toBe(REFRESH_INTERVAL.NEVER)
    })

    it('should set revalidateOnFocus to false', () => {
      expect(swrConfig.once.revalidateOnFocus).toBe(false)
    })

    it('should set revalidateOnReconnect to false', () => {
      expect(swrConfig.once.revalidateOnReconnect).toBe(false)
    })

    it('should set revalidateIfStale to false', () => {
      expect(swrConfig.once.revalidateIfStale).toBe(false)
    })
  })
})

describe('createPollingConfig', () => {
  it('should create config with custom interval', () => {
    const customInterval = 12345 as RefreshInterval
    const config = createPollingConfig(customInterval)
    
    expect(config.refreshInterval).toBe(customInterval)
    expect(config).toEqual({
      refreshInterval: customInterval,
    })
  })

  it('should create config with FAST_15S interval', () => {
    const config = createPollingConfig(REFRESH_INTERVAL.FAST_15S)
    
    expect(config.refreshInterval).toBe(REFRESH_INTERVAL.FAST_15S)
  })

  it('should create config with VERY_SLOW_5M interval', () => {
    const config = createPollingConfig(REFRESH_INTERVAL.VERY_SLOW_5M)
    
    expect(config.refreshInterval).toBe(REFRESH_INTERVAL.VERY_SLOW_5M)
  })
})

describe('RefreshInterval type', () => {
  it('should accept all valid refresh interval values', () => {
    const values: RefreshInterval[] = [
      REFRESH_INTERVAL.NEVER,
      REFRESH_INTERVAL.FAST_15S,
      REFRESH_INTERVAL.MEDIUM_30S,
      REFRESH_INTERVAL.DEFAULT_60S,
      REFRESH_INTERVAL.SLOW_2M,
      REFRESH_INTERVAL.VERY_SLOW_5M,
    ]

    values.forEach((interval) => {
      expect(interval).toBeDefined()
      expect(interval).toBeGreaterThanOrEqual(0)
    })
  })
})
