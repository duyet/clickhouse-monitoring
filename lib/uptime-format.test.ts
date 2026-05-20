import { getResponsiveUptimeLabels } from './uptime-format'
import { describe, expect, it } from 'bun:test'

describe('getResponsiveUptimeLabels', () => {
  it('drops seconds first, then minutes', () => {
    expect(
      getResponsiveUptimeLabels('9 days, 18 hours, 48 minutes and 15 seconds')
    ).toEqual([
      'up 9 days, 18 hours, 48 minutes and 15 seconds',
      'up 9 days, 18 hours and 48 minutes',
      'up 9 days and 18 hours',
    ])
  })

  it('keeps the original value when it cannot parse units', () => {
    expect(getResponsiveUptimeLabels('about a day')).toEqual(['up about a day'])
  })

  it('returns no labels for empty uptime', () => {
    expect(getResponsiveUptimeLabels('')).toEqual([])
  })
})
