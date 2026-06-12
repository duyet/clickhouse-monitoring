import { describe, expect, test } from 'bun:test'
import { securityCharts } from '@/lib/api/charts/security-charts'

const defaultParams = { interval: 'toStartOfHour' as const, lastHours: 24 }

describe('securityCharts', () => {
  const entries = Object.entries(securityCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  test.each(
    entries
  )('"%s" builder returns valid query result', (_name, builder) => {
    const result = builder(defaultParams)

    // Must have a query property
    expect(result).toHaveProperty('query')
    expect(typeof result.query).toBe('string')
    expect(result.query.length).toBeGreaterThan(0)

    // Query must contain SELECT
    expect(result.query).toMatch(/SELECT/i)
  })

  test('known chart names are present', () => {
    const names = Object.keys(securityCharts)
    expect(names).toContain('login-success-rate')
    expect(names).toContain('failed-login-by-user')
    expect(names).toContain('active-sessions-count')
    expect(names).toContain('sessions-by-auth-type')
    expect(names).toContain('sessions-by-interface')
  })

  test('all charts are optional (require system.session_log)', () => {
    for (const [name, builder] of entries) {
      const result = builder(defaultParams)
      expect(result.optional, `${name} should be optional`).toBe(true)
      expect(result.tableCheck, `${name} should have tableCheck`).toBeDefined()
    }
  })
})
