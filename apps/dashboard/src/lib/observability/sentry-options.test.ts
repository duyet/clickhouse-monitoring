import { buildSharedSentryOptions, parseSampleRate } from './sentry-options'
import { describe, expect, it } from 'bun:test'

describe('parseSampleRate', () => {
  it('returns the fallback for empty/undefined input', () => {
    expect(parseSampleRate(undefined, 0.1)).toBe(0.1)
    expect(parseSampleRate('', 0.25)).toBe(0.25)
  })

  it('parses valid rates in [0, 1]', () => {
    expect(parseSampleRate('0', 0.1)).toBe(0)
    expect(parseSampleRate('1', 0.1)).toBe(1)
    expect(parseSampleRate('0.5', 0.1)).toBe(0.5)
  })

  it('rejects out-of-range and non-numeric values, using the fallback', () => {
    expect(parseSampleRate('-0.1', 0.1)).toBe(0.1)
    expect(parseSampleRate('1.5', 0.1)).toBe(0.1)
    expect(parseSampleRate('abc', 0.1)).toBe(0.1)
    expect(parseSampleRate('NaN', 0.1)).toBe(0.1)
  })
})

describe('buildSharedSentryOptions', () => {
  it('returns null when no DSN is configured (OSS default = disabled)', () => {
    expect(
      buildSharedSentryOptions({
        dsn: undefined,
        environment: 'production',
        release: 'abc',
        tracesSampleRate: '0.1',
      })
    ).toBeNull()
    expect(
      buildSharedSentryOptions({
        dsn: '   ',
        environment: undefined,
        release: undefined,
        tracesSampleRate: undefined,
      })
    ).toBeNull()
  })

  it('builds options with trimmed values and sensible defaults', () => {
    const opts = buildSharedSentryOptions({
      dsn: '  https://k@o.ingest.sentry.io/1  ',
      environment: '  production  ',
      release: '  sha123  ',
      tracesSampleRate: '0.3',
    })
    expect(opts).toEqual({
      dsn: 'https://k@o.ingest.sentry.io/1',
      environment: 'production',
      release: 'sha123',
      tracesSampleRate: 0.3,
      sendDefaultPii: false,
    })
  })

  it('defaults environment to development and release to undefined', () => {
    const opts = buildSharedSentryOptions({
      dsn: 'https://k@o.ingest.sentry.io/1',
      environment: undefined,
      release: '',
      tracesSampleRate: undefined,
    })
    expect(opts?.environment).toBe('development')
    expect(opts?.release).toBeUndefined()
    expect(opts?.tracesSampleRate).toBe(0.1)
  })
})
