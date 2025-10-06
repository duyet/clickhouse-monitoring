import { ErrorLogger, formatErrorForDisplay } from '../error-logger'

describe('error-logger', () => {
  const originalNodeEnv = process.env.NODE_ENV
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('ErrorLogger.logError', () => {
    it('logs detailed error in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error')
      const context = { digest: 'abc123', component: 'TestComponent' }

      ErrorLogger.logError(error, context)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const calls = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(calls).toContain('Test error')
      expect(calls).toContain('abc123')
    })

    it('logs sanitized error in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Test error')
      const context = { digest: 'abc123' }

      ErrorLogger.logError(error, context)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1])
      expect(loggedData.message).toBe('Test error')
      expect(loggedData.digest).toBe('abc123')
    })
  })

  describe('ErrorLogger.logWarning', () => {
    it('logs warning in development', () => {
      process.env.NODE_ENV = 'development'
      ErrorLogger.logWarning('Warning message', { component: 'Test' })

      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('logs warning in production', () => {
      process.env.NODE_ENV = 'production'
      ErrorLogger.logWarning('Warning message')

      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('ErrorLogger.logDebug', () => {
    it('logs debug in development', () => {
      process.env.NODE_ENV = 'development'
      ErrorLogger.logDebug('Debug message', { data: 'test' })

      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('does not log debug in production', () => {
      process.env.NODE_ENV = 'production'
      ErrorLogger.logDebug('Debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })
  })

  describe('formatErrorForDisplay', () => {
    it('returns detailed error in development', () => {
      process.env.NODE_ENV = 'development'
      const error = Object.assign(new Error('Test error'), {
        digest: 'abc123',
        stack: 'Error: Test error\n  at line 1',
      })

      const formatted = formatErrorForDisplay(error)

      expect(formatted.title).toContain('Error')
      expect(formatted.message).toBe('Test error')
      expect(formatted.details?.stack).toBeDefined()
      expect(formatted.details?.digest).toBe('abc123')
    })

    it('returns generic error in production', () => {
      process.env.NODE_ENV = 'production'
      const error = Object.assign(new Error('Sensitive error details'), {
        digest: 'abc123',
      })

      const formatted = formatErrorForDisplay(error)

      expect(formatted.title).toBe('Something went wrong')
      expect(formatted.message).toContain('unexpected error')
      expect(formatted.message).not.toContain('Sensitive')
      expect(formatted.details?.digest).toBe('abc123')
      expect(formatted.details?.stack).toBeUndefined()
    })
  })
})
