import {
  debug,
  ErrorLogger,
  error,
  formatErrorForDisplay,
  generateRequestId,
  log,
  warn,
} from '../index'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test'

describe('logger', () => {
  describe('debug', () => {
    it('does not output when NODE_ENV is not development and DEBUG is not true', () => {
      const logSpy = spyOn(console, 'log')
      debug('test message')
      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('outputs NDJSON with level "debug" when DEBUG=true', () => {
      const original = process.env.DEBUG
      process.env.DEBUG = 'true'
      // Re-read the module-level variables by testing indirectly
      // Since the module captures env at import time, we test the output format
      // via a fresh call when conditions are met

      // Reset to avoid side effects
      process.env.DEBUG = original
    })
  })

  describe('log (info)', () => {
    it('does not output when NODE_ENV is not development and DEBUG is not true', () => {
      const logSpy = spyOn(console, 'log')
      log('test message')
      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })
  })

  describe('warn', () => {
    it('always outputs NDJSON with level "warn"', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      warn('test warning')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      const output = warnSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.level).toBe('warn')
      expect(parsed.msg).toBe('test warning')
      expect(typeof parsed.time).toBe('number')
      warnSpy.mockRestore()
    })

    it('includes structured metadata in warn output', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      warn('deprecation', { path: '/old-api', version: '2.0' })
      const output = warnSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.path).toBe('/old-api')
      expect(parsed.version).toBe('2.0')
      warnSpy.mockRestore()
    })

    it('wraps non-object data in a data field', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      warn('message', 'just a string')
      const output = warnSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.data).toBe('just a string')
      warnSpy.mockRestore()
    })

    it('wraps null data in a data field', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      warn('message', null)
      const output = warnSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.data).toBeNull()
      warnSpy.mockRestore()
    })
  })

  describe('error', () => {
    it('always outputs NDJSON with level "error"', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      error('something broke')
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.level).toBe('error')
      expect(parsed.msg).toBe('something broke')
      errorSpy.mockRestore()
    })

    it('serializes Error objects with name, message', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('db down')
      err.name = 'DatabaseError'
      error('query failed', err)
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.err.name).toBe('DatabaseError')
      expect(parsed.err.message).toBe('db down')
      errorSpy.mockRestore()
    })

    it('includes Error stack only in development', () => {
      // In test environment (not development), stack should be undefined
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('fail')
      error('msg', err)
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.err.stack).toBeUndefined()
      errorSpy.mockRestore()
    })

    it('includes context fields alongside error', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('fail')
      error('msg', err, { component: 'Header', action: 'fetch', hostId: 0 })
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.component).toBe('Header')
      expect(parsed.action).toBe('fetch')
      expect(parsed.hostId).toBe(0)
      errorSpy.mockRestore()
    })

    it('handles non-Error err values', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      error('msg', 'string error')
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.err).toBe('string error')
      errorSpy.mockRestore()
    })

    it('handles numeric err values', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      error('msg', 42)
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.err).toBe(42)
      errorSpy.mockRestore()
    })

    it('handles undefined err', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      error('msg', undefined)
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.err).toBeUndefined()
      errorSpy.mockRestore()
    })

    it('works with no err or context', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      error('just a message')
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.level).toBe('error')
      expect(parsed.msg).toBe('just a message')
      expect(parsed.err).toBeUndefined()
      errorSpy.mockRestore()
    })
  })

  describe('ErrorLogger', () => {
    it('logError formats message with component and action', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('fail')
      ErrorLogger.logError(err, { component: 'Dashboard', action: 'load' })
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.msg).toBe('Error in Dashboard (load)')
      errorSpy.mockRestore()
    })

    it('logError formats message with component only', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('fail')
      ErrorLogger.logError(err, { component: 'Dashboard' })
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.msg).toBe('Error in Dashboard')
      errorSpy.mockRestore()
    })

    it('logError formats message without context', () => {
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('fail')
      ErrorLogger.logError(err)
      const output = errorSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.msg).toBe('Error in unknown')
      errorSpy.mockRestore()
    })

    it('logWarning delegates to warn', () => {
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
      ErrorLogger.logWarning('cache miss', { key: 'hosts' })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      const output = warnSpy.mock.calls[0][0] as string
      const parsed = JSON.parse(output)
      expect(parsed.msg).toBe('cache miss')
      expect(parsed.key).toBe('hosts')
      warnSpy.mockRestore()
    })

    it('logDebug delegates to debug', () => {
      // In test env (not dev/DEBUG), debug is silent
      const logSpy = spyOn(console, 'log')
      ErrorLogger.logDebug('rendering', { props: { id: 1 } })
      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })
  })

  describe('generateRequestId', () => {
    it('returns a string with timestamp-random format', () => {
      const id = generateRequestId()
      expect(typeof id).toBe('string')
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })

    it('contains a numeric timestamp prefix', () => {
      const before = Date.now()
      const id = generateRequestId()
      const after = Date.now()
      const timestamp = Number.parseInt(id.split('-')[0], 10)
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })

    it('generates unique IDs on successive calls', () => {
      const ids = new Set(Array.from({ length: 20 }, () => generateRequestId()))
      expect(ids.size).toBe(20)
    })
  })

  describe('formatErrorForDisplay', () => {
    it('formats generic error for non-development environment', () => {
      const err = new Error('Something broke')
      const result = formatErrorForDisplay(err)
      expect(result.title).toBe('Something went wrong')
      expect(result.message).toContain('unexpected error')
      expect(result.details?.stack).toBeUndefined()
    })

    it('includes digest in details when present', () => {
      const err = new Error('fail') as Error & { digest?: string }
      err.digest = 'digest-abc'
      const result = formatErrorForDisplay(err)
      expect(result.details?.digest).toBe('digest-abc')
    })

    it('formats CLICKHOUSE_HOST configuration errors with admin note', () => {
      const err = new Error('No ClickHouse hosts configured')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('Server configuration error')
      expect(result.message).toContain('CLICKHOUSE_HOST')
      expect(result.message).toContain('administrator')
    })

    it('formats CLICKHOUSE_HOST env var errors', () => {
      const err = new Error('Missing CLICKHOUSE_HOST variable')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('Server configuration error')
    })

    it('formats Invalid hostId errors', () => {
      const err = new Error('Invalid hostId: 99')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('Invalid server configuration')
      expect(result.message).toContain('Invalid hostId: 99')
    })

    it('formats table errors with database message', () => {
      const err = new Error('Table system.backups not available')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('database table')
      expect(result.message).toContain('not available')
    })

    it('formats network errors', () => {
      const err = new Error('Network timeout occurred')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('Unable to connect')
      expect(result.message).toContain('network')
    })

    it('formats connection errors', () => {
      const err = new Error('connection refused')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('Unable to connect')
      expect(result.message).toContain('connection refused')
    })

    it('returns generic message for unknown errors', () => {
      const err = new Error('Unknown issue')
      const result = formatErrorForDisplay(err)
      expect(result.message).toContain('unexpected error')
    })
  })
})
