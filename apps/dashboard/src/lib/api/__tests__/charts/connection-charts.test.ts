import { describe, expect, test } from 'bun:test'
import { connectionCharts } from '@/lib/api/charts/connection-charts'

describe('connectionCharts', () => {
  const entries = Object.entries(connectionCharts)

  test('map is non-empty', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  describe.each(entries)('chart "%s"', (_name, builder) => {
    test('returns an object with a query property', () => {
      const result = builder({})
      expect(result).toBeDefined()
      expect(result).toHaveProperty('query')
    })

    test('query is a non-empty string containing SELECT', () => {
      const result = builder({})
      if ('query' in result) {
        expect(typeof result.query).toBe('string')
        expect(result.query.length).toBeGreaterThan(0)
        expect(result.query).toMatch(/SELECT/i)
      }
    })
  })

  test('connections-http references HTTPConnection metrics', () => {
    const result = connectionCharts['connections-http']({})
    if ('query' in result) {
      expect(result.query).toContain('HTTPConnection')
    }
  })

  test('connections-interserver references InterserverConnection metrics', () => {
    const result = connectionCharts['connections-interserver']({})
    if ('query' in result) {
      expect(result.query).toContain('InterserverConnection')
    }
  })

  test('connections-pool queries multiple connection types', () => {
    const result = connectionCharts['connections-pool']({})
    if ('query' in result) {
      expect(result.query).toContain('TCPConnection')
      expect(result.query).toContain('HTTPConnection')
      expect(result.query).toContain('InterserverConnection')
    }
  })
})
