import {
  checkRateLimit,
  getRateLimitHeaders,
  type RateLimitResult,
  withRateLimit,
} from '../rate-limit'
import { describe, expect, test } from 'bun:test'

// Generate unique test IP to avoid cache collision across tests
let testCounter = 0
function getTestIP(): string {
  return `192.168.${Math.floor(testCounter / 256)}.${testCounter++ % 256}`
}

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    test('allows requests within limit', () => {
      const testIP = getTestIP()
      const results: RateLimitResult[] = []
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit(testIP))
      }

      expect(results[0].success).toBe(true)
      expect(results[0].remaining).toBe(4)
      expect(results[4].success).toBe(true)
      expect(results[4].remaining).toBe(0)
    })

    test('blocks requests over limit', () => {
      const testIP = getTestIP()
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIP)
      }

      // 6th request should be blocked
      const result = checkRateLimit(testIP)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    test('different IPs have independent limits', () => {
      const ip1 = getTestIP()
      const ip2 = getTestIP()

      // Use up all requests for ip1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1)
      }

      // ip1 should be blocked
      expect(checkRateLimit(ip1).success).toBe(false)

      // ip2 should still work (first request)
      const ip2Result = checkRateLimit(ip2)
      expect(ip2Result.success).toBe(true)
      expect(ip2Result.remaining).toBe(4)
    })

    test('provides correct resetAt timestamp', () => {
      const testIP = getTestIP()
      const result = checkRateLimit(testIP)
      const now = Date.now()
      const expectedResetAt = now + 60000 // 1 minute

      expect(result.resetAt).toBeGreaterThanOrEqual(now)
      expect(result.resetAt).toBeLessThanOrEqual(expectedResetAt + 100) // 100ms tolerance
    })
  })

  describe('getRateLimitHeaders', () => {
    test('returns standard headers for successful requests', () => {
      const result = {
        success: true,
        remaining: 3,
        resetAt: Date.now() + 60000,
      }
      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('5')
      expect(headers['X-RateLimit-Remaining']).toBe('3')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
      expect(headers['Retry-After']).toBeUndefined()
    })

    test('includes Retry-After header for failed requests', () => {
      const result = {
        success: false,
        remaining: 0,
        resetAt: Date.now() + 30000,
      }
      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('5')
      expect(headers['X-RateLimit-Remaining']).toBe('0')
      expect(headers['Retry-After']).toBeDefined()
      expect(Number.parseInt(headers['Retry-After'], 10)).toBeGreaterThan(0)
    })
  })

  describe('withRateLimit', () => {
    test('returns null for requests within limit', () => {
      const testIP = getTestIP()
      const response = withRateLimit(testIP)
      expect(response).toBeNull()
    })

    test('returns 429 response for requests over limit', () => {
      const testIP = getTestIP()
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        withRateLimit(testIP)
      }

      // 6th request should return 429
      const response = withRateLimit(testIP)
      expect(response).not.toBeNull()
      expect(response?.status).toBe(429)
      expect(response?.headers.get('Content-Type')).toBe('application/json')
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response?.headers.get('Retry-After')).toBeDefined()
    })

    test('429 response includes error message', async () => {
      const testIP = getTestIP()
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        withRateLimit(testIP)
      }

      const response = withRateLimit(testIP)
      const body = await response?.json()
      expect(body).toEqual({ error: 'Too many requests' })
    })
  })
})
