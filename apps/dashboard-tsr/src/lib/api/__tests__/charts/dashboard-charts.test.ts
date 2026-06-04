import { describe, expect, test } from 'bun:test'
import { dashboardCharts } from '@/lib/api/charts/dashboard-charts'

describe('dashboard-charts', () => {
  const entries = Object.entries(dashboardCharts)

  test('is non-empty', () => {
    expect(entries.length).toBeGreaterThanOrEqual(2)
  })

  test.each(entries)('%s returns a query', (_name, builder) => {
    const result = builder({})
    expect(result).toBeDefined()
    expect(result.query).toContain('SELECT')
    expect(result.optional).toBe(true)
  })

  test('dashboard-charts queries chart config table', () => {
    const result = dashboardCharts['dashboard-charts']!({})
    expect(result.query).toContain('FINAL')
    expect(result.query).toContain('ordering')
  })

  test('dashboard-settings queries settings table', () => {
    const result = dashboardCharts['dashboard-settings']!({})
    expect(result.query).toContain('FINAL')
  })
})
