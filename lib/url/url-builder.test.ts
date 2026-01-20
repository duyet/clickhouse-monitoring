import { describe, expect, it } from 'bun:test'

import { buildUrl } from './url-builder'

describe('buildUrl', () => {
  describe('basic functionality', () => {
    it('should return base URL when no params provided', () => {
      const result = buildUrl('/overview', {})
      expect(result).toBe('/overview')
    })

    it('should add query params with ? separator', () => {
      const result = buildUrl('/overview', { host: 0 })
      expect(result).toBe('/overview?host=0')
    })

    it('should merge with existing query params using & separator', () => {
      const existing = new URLSearchParams('database=default')
      const result = buildUrl('/table?status=active', { host: 1 }, existing)
      expect(result).toBe('/table?status=active&host=1')
    })

    it('should return base URL when params are empty object', () => {
      const result = buildUrl('/dashboard', {})
      expect(result).toBe('/dashboard')
    })
  })

  describe('value types', () => {
    it('should handle string values', () => {
      const result = buildUrl('/search', { query: 'SELECT * FROM users' })
      expect(result).toBe('/search?query=SELECT+%2A+FROM+users')
    })

    it('should handle number values', () => {
      const result = buildUrl('/api', { page: 1, limit: 50 })
      expect(result).toBe('/api?page=1&limit=50')
    })

    it('should handle boolean values', () => {
      const result = buildUrl('/api', { enabled: true, disabled: false })
      expect(result).toBe('/api?enabled=true&disabled=false')
    })

    it('should handle zero values', () => {
      const result = buildUrl('/api', { offset: 0 })
      expect(result).toBe('/api?offset=0')
    })

    it('should handle negative numbers', () => {
      const result = buildUrl('/api', { value: -42 })
      expect(result).toBe('/api?value=-42')
    })

    it('should handle decimal numbers', () => {
      const result = buildUrl('/api', { ratio: 0.5 })
      expect(result).toBe('/api?ratio=0.5')
    })
  })

  describe('undefined and null handling', () => {
    it('should ignore undefined values', () => {
      const result = buildUrl('/api', { a: 1, b: undefined, c: 3 })
      expect(result).toBe('/api?a=1&c=3')
      expect(result).not.toContain('b=')
    })

    it('should ignore all undefined values', () => {
      const result = buildUrl('/api', { a: undefined, b: undefined })
      expect(result).toBe('/api')
    })

    it('should handle null values as strings', () => {
      const result = buildUrl('/api', { value: null as never })
      expect(result).toBe('/api?value=null')
    })
  })

  describe('URL encoding', () => {
    it('should properly encode spaces', () => {
      const result = buildUrl('/search', { query: 'hello world' })
      expect(result).toBe('/search?query=hello+world')
    })

    it('should properly encode special characters', () => {
      const result = buildUrl('/api', { data: 'key=value&test' })
      expect(result).toContain('data=key%3Dvalue%26test')
    })

    it('should properly encode unicode', () => {
      const result = buildUrl('/api', { name: 'café' })
      expect(result).toContain('name=')
    })

    it('should properly encode multiple special characters', () => {
      const result = buildUrl('/api', { path: '/a/b/c?x=1' })
      expect(result).toContain('path=%2Fa%2Fb%2Fc%3Fx%3D1')
    })
  })

  describe('multiple parameters', () => {
    it('should handle multiple parameters', () => {
      const result = buildUrl('/table', { database: 'default', table: 'users', limit: 100 })
      expect(result).toBe('/table?database=default&table=users&limit=100')
    })

    it('should preserve parameter order', () => {
      const params = { a: 1, b: 2, c: 3 }
      const result = buildUrl('/test', params)
      expect(result).toBe('/test?a=1&b=2&c=3')
    })

    it('should handle many parameters', () => {
      const params = { a: '1', b: '2', c: '3', d: '4', e: '5' }
      const result = buildUrl('/test', params)
      expect(result).toBe('/test?a=1&b=2&c=3&d=4&e=5')
    })
  })

  describe('existing search params', () => {
    it('should merge with URLSearchParams string', () => {
      const existing = new URLSearchParams('database=default&status=active')
      const result = buildUrl('/table', { host: 0 }, existing)
      expect(result).toBe('/table?database=default&status=active&host=0')
    })

    it('should handle empty URLSearchParams', () => {
      const existing = new URLSearchParams('')
      const result = buildUrl('/table', { host: 1 }, existing)
      expect(result).toBe('/table?host=1')
    })

    it('should handle URLSearchParams as string', () => {
      const result = buildUrl('/table', { host: 1 }, 'database=test&limit=50')
      expect(result).toBe('/table?database=test&limit=50&host=1')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string base URL', () => {
      const result = buildUrl('', { key: 'value' })
      expect(result).toBe('?key=value')
    })

    it('should handle base URL with hash', () => {
      const result = buildUrl('/page#section', { tab: '1' })
      expect(result).toBe('/page?tab=1#section')
    })

    it('should handle base URL with path containing ? already', () => {
      const result = buildUrl('/search?q=test', { filter: 'active' })
      expect(result).toBe('/search?q=test&filter=active')
    })

    it('should handle base URL with path containing & already', () => {
      const result = buildUrl('/api?a=1&b=2', { c: 3 })
      expect(result).toBe('/api?a=1&b=2&c=3')
    })

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(1000)
      const result = buildUrl('/api', { data: longValue })
      expect(result).toContain('data=')
      expect(result.length).toBeGreaterThan(1000)
    })

    it('should handle empty string values', () => {
      const result = buildUrl('/api', { search: '', filter: '' })
      expect(result).toBe('/api?search=&filter=')
    })

    it('should handle boolean false', () => {
      const result = buildUrl('/api', { enabled: false, visible: false })
      expect(result).toBe('/api?enabled=false&visible=false')
    })

    it('should handle boolean true', () => {
      const result = buildUrl('/api', { enabled: true, visible: true })
      expect(result).toBe('/api?enabled=true&visible=true')
    })
  })

  describe('complex scenarios', () => {
    it('should build URL for API route with multiple params', () => {
      const result = buildUrl('/api/v1/data', {
        host: 0,
        database: 'default',
        table: 'users',
        format: 'json',
        limit: 100,
        offset: 0,
      })
      expect(result).toContain('host=0')
      expect(result).toContain('database=default')
      expect(result).toContain('table=users')
      expect(result).toContain('format=json')
      expect(result).toContain('limit=100')
      expect(result).toContain('offset=0')
    })

    it('should merge with existing complex params', () => {
      const existing = new URLSearchParams('sort=desc&filter=active')
      const result = buildUrl('/users', { page: 2, search: 'test' }, existing)
      expect(result).toContain('sort=desc')
      expect(result).toContain('filter=active')
      expect(result).toContain('page=2')
      expect(result).toContain('search=test')
    })

    it('should handle mixed data types in single URL', () => {
      const result = buildUrl('/api', {
        id: 123,
        name: 'test',
        active: true,
        ratio: 0.75,
        count: null as never,
      })
      expect(result).toContain('id=123')
      expect(result).toContain('name=test')
      expect(result).toContain('active=true')
      expect(result).toContain('ratio=0.75')
      expect(result).toContain('count=null')
    })
  })

  describe('separator detection', () => {
    it('should use ? separator when base URL has no query params', () => {
      const result = buildUrl('/path', { key: 'value' })
      expect(result).toContain('?')
      expect(result).not.toContain('&')
    })

    it('should use & separator when base URL already has query params', () => {
      const result = buildUrl('/path?existing=param', { new: 'value' })
      expect(result).toContain('&new=')
      expect(result).toContain('?existing=param')
    })

    it('should use & separator when base URL has multiple query params', () => {
      const result = buildUrl('/path?a=1&b=2', { c: 3 })
      expect(result).toContain('&c=3')
    })
  })
})
