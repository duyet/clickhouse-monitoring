import {
  getEnvironment,
  isDevelopment,
  isProduction,
  isTest,
  shouldShowDetailedErrors,
} from '../env-utils'

describe('env-utils', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('isDevelopment', () => {
    it('returns true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    it('returns false when NODE_ENV is not development', () => {
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('isProduction', () => {
    it('returns true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)
    })

    it('returns false when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
    })
  })

  describe('isTest', () => {
    it('returns true when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test'
      expect(isTest()).toBe(true)
    })

    it('returns false when NODE_ENV is not test', () => {
      process.env.NODE_ENV = 'development'
      expect(isTest()).toBe(false)
    })
  })

  describe('shouldShowDetailedErrors', () => {
    it('returns true in development', () => {
      process.env.NODE_ENV = 'development'
      expect(shouldShowDetailedErrors()).toBe(true)
    })

    it('returns false in production', () => {
      process.env.NODE_ENV = 'production'
      expect(shouldShowDetailedErrors()).toBe(false)
    })
  })

  describe('getEnvironment', () => {
    it('returns current NODE_ENV', () => {
      process.env.NODE_ENV = 'production'
      expect(getEnvironment()).toBe('production')
    })

    it('returns development as default when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV
      expect(getEnvironment()).toBe('development')
    })
  })
})
