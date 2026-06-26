import { describe, expect, it } from 'bun:test'

const SEVERITY_LEVELS = [
  'Trace',
  'Debug',
  'Information',
  'Warning',
  'Error',
  'Fatal',
] as const
type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

function matchesSeverityFilter(
  level: string,
  filter: string | undefined
): boolean {
  if (!filter || filter === 'All') return true
  return level === filter
}

describe('log severity filter', () => {
  it('returns true when no filter set', () => {
    expect(matchesSeverityFilter('Error', undefined)).toBe(true)
    expect(matchesSeverityFilter('Fatal', 'All')).toBe(true)
  })

  it('filters by exact severity', () => {
    expect(matchesSeverityFilter('Error', 'Error')).toBe(true)
    expect(matchesSeverityFilter('Debug', 'Error')).toBe(false)
  })

  it('Fatal level matches Fatal filter', () => {
    expect(matchesSeverityFilter('Fatal', 'Fatal')).toBe(true)
    expect(matchesSeverityFilter('Error', 'Fatal')).toBe(false)
  })

  it('every defined severity level matches itself', () => {
    for (const level of SEVERITY_LEVELS) {
      expect(matchesSeverityFilter(level, level)).toBe(true)
    }
  })

  it('no level matches a different severity', () => {
    expect(matchesSeverityFilter('Trace', 'Debug')).toBe(false)
    expect(matchesSeverityFilter('Warning', 'Information')).toBe(false)
  })

  it('case-sensitive match — lowercase does not match', () => {
    expect(matchesSeverityFilter('error', 'Error')).toBe(false)
  })
})
