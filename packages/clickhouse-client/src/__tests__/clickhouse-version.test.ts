import { describe, expect, it } from 'bun:test'

const {
  parseVersion,
  compareVersions,
  meetsMinVersion,
  versionMatchesRange,
  parseSemverRange,
  matchesSemverRange,
  selectVersionedSql,
  getTableInfoMessage,
  SYSTEM_TABLE_INFO,
} = await import(
  new URL('../clickhouse-version.ts?test=version', import.meta.url).href
)

describe('parseVersion', () => {
  it('parses a standard 3-part version', () => {
    const v = parseVersion('24.3.1')
    expect(v).toEqual({
      major: 24,
      minor: 3,
      patch: 1,
      build: undefined,
      raw: '24.3.1',
    })
  })

  it('parses a 4-part version with build number', () => {
    const v = parseVersion('24.3.1.1')
    expect(v).toEqual({
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    })
  })

  it('handles a single number (major only)', () => {
    const v = parseVersion('24')
    expect(v.major).toBe(24)
    expect(v.minor).toBe(0)
    expect(v.patch).toBe(0)
  })

  it('handles two-part version', () => {
    const v = parseVersion('24.3')
    expect(v.major).toBe(24)
    expect(v.minor).toBe(3)
    expect(v.patch).toBe(0)
  })

  it('handles empty string gracefully', () => {
    const v = parseVersion('')
    expect(v.major).toBe(0)
    expect(v.minor).toBe(0)
    expect(v.patch).toBe(0)
    expect(v.raw).toBe('')
  })
})

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    const a = parseVersion('24.3.1')
    const b = parseVersion('24.3.1')
    expect(compareVersions(a, b)).toBe(0)
  })

  it('returns positive when a > b (major)', () => {
    const a = parseVersion('25.1.0')
    const b = parseVersion('24.3.1')
    expect(compareVersions(a, b)).toBeGreaterThan(0)
  })

  it('returns negative when a < b (major)', () => {
    const a = parseVersion('23.8.1')
    const b = parseVersion('24.3.1')
    expect(compareVersions(a, b)).toBeLessThan(0)
  })

  it('compares minor when major is equal', () => {
    const a = parseVersion('24.5.0')
    const b = parseVersion('24.3.0')
    expect(compareVersions(a, b)).toBeGreaterThan(0)
  })

  it('compares patch when major and minor are equal', () => {
    const a = parseVersion('24.3.2')
    const b = parseVersion('24.3.1')
    expect(compareVersions(a, b)).toBeGreaterThan(0)
  })

  it('ignores build number in comparison', () => {
    const a = parseVersion('24.3.1.5')
    const b = parseVersion('24.3.1.1')
    // build is not compared, returns 0
    expect(compareVersions(a, b)).toBe(0)
  })
})

describe('meetsMinVersion', () => {
  it('returns true when version meets minimum', () => {
    const v = parseVersion('24.5.1')
    expect(meetsMinVersion(v, 24)).toBe(true)
  })

  it('returns false when version is below minimum', () => {
    const v = parseVersion('23.8.1')
    expect(meetsMinVersion(v, 24)).toBe(false)
  })

  it('checks minor version', () => {
    const v = parseVersion('24.3.1')
    expect(meetsMinVersion(v, 24, 5)).toBe(false)
    expect(meetsMinVersion(v, 24, 3)).toBe(true)
    expect(meetsMinVersion(v, 24, 1)).toBe(true)
  })

  it('checks patch version', () => {
    const v = parseVersion('24.3.1')
    expect(meetsMinVersion(v, 24, 3, 2)).toBe(false)
    expect(meetsMinVersion(v, 24, 3, 1)).toBe(true)
  })
})

describe('parseSemverRange', () => {
  it('parses >= prefix', () => {
    const bounds = parseSemverRange('>=24.1')
    expect(bounds.min).toEqual(expect.objectContaining({ major: 24, minor: 1 }))
    expect(bounds.minInclusive).toBe(true)
  })

  it('parses > prefix (exclusive)', () => {
    const bounds = parseSemverRange('>24.1')
    expect(bounds.min).toEqual(expect.objectContaining({ major: 24, minor: 1 }))
    expect(bounds.minInclusive).toBe(false)
  })

  it('parses <= prefix', () => {
    const bounds = parseSemverRange('<=24.5')
    expect(bounds.max).toEqual(expect.objectContaining({ major: 24, minor: 5 }))
    expect(bounds.maxInclusive).toBe(true)
  })

  it('parses < prefix (exclusive)', () => {
    const bounds = parseSemverRange('<24.5')
    expect(bounds.max).toEqual(expect.objectContaining({ major: 24, minor: 5 }))
    expect(bounds.maxInclusive).toBe(false)
  })

  it('parses compound range ">=24.1 <24.5"', () => {
    const bounds = parseSemverRange('>=24.1 <24.5')
    expect(bounds.min).toEqual(expect.objectContaining({ major: 24, minor: 1 }))
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.max).toEqual(expect.objectContaining({ major: 24, minor: 5 }))
    expect(bounds.maxInclusive).toBe(false)
  })

  it('parses caret range ^24.1.2', () => {
    const bounds = parseSemverRange('^24.1.2')
    expect(bounds.min).toEqual(
      expect.objectContaining({ major: 24, minor: 1, patch: 2 })
    )
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.max).toEqual(
      expect.objectContaining({ major: 25, minor: 0, patch: 0 })
    )
    expect(bounds.maxInclusive).toBe(false)
  })

  it('parses tilde range ~24.1.2', () => {
    const bounds = parseSemverRange('~24.1.2')
    expect(bounds.min).toEqual(
      expect.objectContaining({ major: 24, minor: 1, patch: 2 })
    )
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.max).toEqual(
      expect.objectContaining({ major: 24, minor: 2, patch: 0 })
    )
    expect(bounds.maxInclusive).toBe(false)
  })

  it('parses plain version as caret-like range', () => {
    const bounds = parseSemverRange('24.1')
    expect(bounds.min).toEqual(expect.objectContaining({ major: 24, minor: 1 }))
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.max).toEqual(
      expect.objectContaining({ major: 25, minor: 0, patch: 0 })
    )
    expect(bounds.maxInclusive).toBe(false)
  })

  it('parses =version', () => {
    const bounds = parseSemverRange('=24.3')
    expect(bounds.min).toEqual(expect.objectContaining({ major: 24, minor: 3 }))
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.max).toEqual(expect.objectContaining({ major: 25 }))
  })

  it('returns default bounds for empty string', () => {
    const bounds = parseSemverRange('')
    expect(bounds.min).toBeUndefined()
    expect(bounds.max).toBeUndefined()
    expect(bounds.minInclusive).toBe(true)
    expect(bounds.maxInclusive).toBe(true)
  })

  it('returns default bounds for whitespace', () => {
    const bounds = parseSemverRange('   ')
    expect(bounds.min).toBeUndefined()
    expect(bounds.max).toBeUndefined()
  })
})

describe('matchesSemverRange', () => {
  it('matches >=24.1 for version 24.3.1', () => {
    const v = parseVersion('24.3.1')
    expect(matchesSemverRange(v, '>=24.1')).toBe(true)
  })

  it('does not match >=24.5 for version 24.3.1', () => {
    const v = parseVersion('24.3.1')
    expect(matchesSemverRange(v, '>=24.5')).toBe(false)
  })

  it('matches range >=24.1 <24.5 for 24.3.1', () => {
    const v = parseVersion('24.3.1')
    expect(matchesSemverRange(v, '>=24.1 <24.5')).toBe(true)
  })

  it('does not match range >=24.1 <24.2 for 24.3.1', () => {
    const v = parseVersion('24.3.1')
    expect(matchesSemverRange(v, '>=24.1 <24.2')).toBe(false)
  })

  it('matches ^24.1 for 24.3.1', () => {
    const v = parseVersion('24.3.1')
    expect(matchesSemverRange(v, '^24.1')).toBe(true)
  })

  it('does not match ^24.1 for 25.0.0', () => {
    const v = parseVersion('25.0.0')
    expect(matchesSemverRange(v, '^24.1')).toBe(false)
  })

  it('matches ~24.3.1 for 24.3.5', () => {
    const v = parseVersion('24.3.5')
    expect(matchesSemverRange(v, '~24.3.1')).toBe(true)
  })

  it('does not match ~24.3.1 for 24.4.0', () => {
    const v = parseVersion('24.4.0')
    expect(matchesSemverRange(v, '~24.3.1')).toBe(false)
  })

  it('matches >24.1 (exclusive) for 24.2.0', () => {
    const v = parseVersion('24.2.0')
    expect(matchesSemverRange(v, '>24.1')).toBe(true)
  })

  it('does not match >24.1 (exclusive) for 24.1.0', () => {
    const v = parseVersion('24.1.0')
    expect(matchesSemverRange(v, '>24.1')).toBe(false)
  })

  it('matches <=24.3 for 24.3.0', () => {
    const v = parseVersion('24.3.0')
    expect(matchesSemverRange(v, '<=24.3')).toBe(true)
  })

  it('matches plain version 24.1 for 24.3.5', () => {
    const v = parseVersion('24.3.5')
    expect(matchesSemverRange(v, '24.1')).toBe(true) // >=24.1 <25.0
  })
})

describe('selectVersionedSql', () => {
  it('returns string as-is', () => {
    expect(selectVersionedSql('SELECT 1', null)).toBe('SELECT 1')
  })

  it('throws on empty array', () => {
    expect(() => selectVersionedSql([], parseVersion('24.1'))).toThrow(
      'VersionedSql array cannot be empty'
    )
  })

  it('returns first (oldest) entry when no version', () => {
    const sql = [
      { since: '23.8', sql: 'OLD' },
      { since: '24.1', sql: 'NEW' },
    ]
    expect(selectVersionedSql(sql, null)).toBe('OLD')
  })

  it('selects the highest since <= current version', () => {
    const sql = [
      { since: '23.8', sql: 'V23_8' },
      { since: '24.1', sql: 'V24_1' },
      { since: '24.5', sql: 'V24_5' },
    ]
    const v = parseVersion('24.3.1')
    expect(selectVersionedSql(sql, v)).toBe('V24_1')
  })

  it('selects exact match version', () => {
    const sql = [
      { since: '23.8', sql: 'V23_8' },
      { since: '24.1', sql: 'V24_1' },
    ]
    const v = parseVersion('24.1.0')
    expect(selectVersionedSql(sql, v)).toBe('V24_1')
  })

  it('selects newest entry for very new version', () => {
    const sql = [
      { since: '23.8', sql: 'V23_8' },
      { since: '24.1', sql: 'V24_1' },
    ]
    const v = parseVersion('25.0.0')
    expect(selectVersionedSql(sql, v)).toBe('V24_1')
  })

  it('falls back to oldest when version is older than all entries', () => {
    const sql = [
      { since: '23.8', sql: 'V23_8' },
      { since: '24.1', sql: 'V24_1' },
    ]
    const v = parseVersion('22.1.0')
    expect(selectVersionedSql(sql, v)).toBe('V23_8')
  })

  it('handles unsorted input array', () => {
    const sql = [
      { since: '24.5', sql: 'V24_5' },
      { since: '23.8', sql: 'V23_8' },
      { since: '24.1', sql: 'V24_1' },
    ]
    const v = parseVersion('24.3.0')
    expect(selectVersionedSql(sql, v)).toBe('V24_1')
  })
})

describe('versionMatchesRange', () => {
  it('matches when within range', () => {
    const v = parseVersion('24.3.1')
    expect(versionMatchesRange(v, '24.1', '24.5')).toBe(true)
  })

  it('does not match when below min', () => {
    const v = parseVersion('23.8.1')
    expect(versionMatchesRange(v, '24.1', undefined)).toBe(false)
  })

  it('does not match when at or above max (exclusive)', () => {
    const v = parseVersion('24.5.0')
    expect(versionMatchesRange(v, undefined, '24.5')).toBe(false)
  })

  it('matches when only min specified', () => {
    const v = parseVersion('25.0.0')
    expect(versionMatchesRange(v, '24.1', undefined)).toBe(true)
  })

  it('matches when only max specified', () => {
    const v = parseVersion('23.8.1')
    expect(versionMatchesRange(v, undefined, '24.1')).toBe(true)
  })

  it('matches when no bounds specified', () => {
    const v = parseVersion('24.3.1')
    expect(versionMatchesRange(v, undefined, undefined)).toBe(true)
  })
})

describe('SYSTEM_TABLE_INFO', () => {
  it('contains info for system.metric_log', () => {
    expect(SYSTEM_TABLE_INFO['system.metric_log']).toBeDefined()
    expect(SYSTEM_TABLE_INFO['system.metric_log'].requiresConfig).toBe(true)
  })

  it('contains info for system.zookeeper', () => {
    expect(SYSTEM_TABLE_INFO['system.zookeeper']).toBeDefined()
    expect(SYSTEM_TABLE_INFO['system.zookeeper'].description).toContain(
      'ZooKeeper'
    )
  })

  it('contains info for system.backup_log', () => {
    expect(SYSTEM_TABLE_INFO['system.backup_log']).toBeDefined()
    expect(SYSTEM_TABLE_INFO['system.backup_log'].minVersion?.major).toBe(22)
  })
})

describe('getTableInfoMessage', () => {
  it('returns description for known tables', () => {
    const msg = getTableInfoMessage('system.metric_log')
    expect(msg).toContain('metric_log')
  })

  it('returns generic message for unknown tables', () => {
    const msg = getTableInfoMessage('system.unknown_table')
    expect(msg).toContain('may require specific configuration')
  })
})
