import { describe, it, expect, afterEach } from 'bun:test'
import {
  isDevelopment,
  isProduction,
  isTest,
  shouldShowDetailedErrors,
  getEnvironment,
} from './env-utils'

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

describe('getEnvironment', () => {
  it('returns the current NODE_ENV value', () => {
    process.env.NODE_ENV = 'production'
    expect(getEnvironment()).toBe('production')
  })

  it('returns development when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'
    expect(getEnvironment()).toBe('development')
  })

  it('returns test when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(getEnvironment()).toBe('test')
  })

  it('falls back to development when NODE_ENV is unset', () => {
    // In bun test, typeof window === 'undefined' (server path), so fallback is 'development'
    delete process.env.NODE_ENV
    expect(getEnvironment()).toBe('development')
  })
})

describe('isDevelopment', () => {
  it('returns true when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'
    expect(isDevelopment()).toBe(true)
  })

  it('returns false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(isDevelopment()).toBe(false)
  })

  it('returns false when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(isDevelopment()).toBe(false)
  })

  it('returns true when NODE_ENV is unset (server-side fallback is development)', () => {
    delete process.env.NODE_ENV
    expect(isDevelopment()).toBe(true)
  })
})

describe('isProduction', () => {
  it('returns true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(isProduction()).toBe(true)
  })

  it('returns false when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'
    expect(isProduction()).toBe(false)
  })

  it('returns false when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(isProduction()).toBe(false)
  })
})

describe('isTest', () => {
  it('returns true when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(isTest()).toBe(true)
  })

  it('returns false when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'
    expect(isTest()).toBe(false)
  })

  it('returns false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(isTest()).toBe(false)
  })
})

describe('shouldShowDetailedErrors', () => {
  it('returns true when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development'
    expect(shouldShowDetailedErrors()).toBe(true)
  })

  it('returns false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(shouldShowDetailedErrors()).toBe(false)
  })

  it('returns false when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(shouldShowDetailedErrors()).toBe(false)
  })

  it('mirrors isDevelopment', () => {
    for (const env of ['development', 'production', 'test', 'staging']) {
      process.env.NODE_ENV = env
      expect(shouldShowDetailedErrors()).toBe(isDevelopment())
    }
  })
})
