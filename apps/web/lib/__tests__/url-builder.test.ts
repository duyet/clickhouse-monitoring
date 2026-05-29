import { buildUrl } from '../url/url-builder'
import { describe, expect, it } from 'bun:test'

describe('buildUrl', () => {
  it('builds URL with single param', () => {
    expect(buildUrl('/overview', { host: 0 })).toBe('/overview?host=0')
  })

  it('builds URL with multiple params', () => {
    const result = buildUrl('/table', { host: 1, database: 'default' })
    expect(result).toContain('host=1')
    expect(result).toContain('database=default')
    expect(result.startsWith('/table?')).toBe(true)
  })

  it('uses & separator when base URL already has query params', () => {
    const result = buildUrl('/table?database=default', { host: 1 })
    expect(result).toBe('/table?database=default&host=1')
  })

  it('uses ? separator when base URL has no query params', () => {
    const result = buildUrl('/overview', { host: 0 })
    expect(result).toContain('?')
    expect(result).not.toContain('&')
  })

  it('ignores undefined values', () => {
    const result = buildUrl('/overview', {
      host: 0,
      filter: undefined,
    })
    expect(result).toBe('/overview?host=0')
  })

  it('converts number values to strings', () => {
    const result = buildUrl('/page', { count: 42 })
    expect(result).toBe('/page?count=42')
  })

  it('converts boolean values to strings', () => {
    const result = buildUrl('/page', { active: true })
    expect(result).toBe('/page?active=true')
  })

  it('returns base URL when all params are undefined', () => {
    const result = buildUrl('/overview', { host: undefined })
    expect(result).toBe('/overview')
  })

  it('returns base URL when params object is empty', () => {
    const result = buildUrl('/overview', {})
    expect(result).toBe('/overview')
  })

  it('merges with existing URLSearchParams', () => {
    const existing = new URLSearchParams('database=default&status=active')
    const result = buildUrl('/table', { host: 1 }, existing)
    expect(result).toContain('host=1')
    expect(result).toContain('database=default')
    expect(result).toContain('status=active')
  })

  it('merges with existing search params string', () => {
    const result = buildUrl('/table', { host: 1 }, 'database=default')
    expect(result).toContain('host=1')
    expect(result).toContain('database=default')
  })

  it('new params override existing search params with same key', () => {
    const existing = new URLSearchParams('host=0')
    const result = buildUrl('/table', { host: 2 }, existing)
    // URLSearchParams.set overwrites, so the last set wins
    const url = new URL(result, 'http://localhost')
    expect(url.searchParams.get('host')).toBe('2')
  })
})
