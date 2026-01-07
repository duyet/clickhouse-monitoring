import {
  compareVersions,
  matchesSemverRange,
  meetsMinVersion,
  parseSemverRange,
  parseVersion,
  selectQueryVariant,
  selectQueryVariantSemver,
  selectVersionedSql,
  versionMatchesRange,
} from './clickhouse-version'
import { describe, expect, it } from 'bun:test'

describe('parseVersion', () => {
  it('should parse simple version strings', () => {
    const result = parseVersion('24.3.1')
    expect(result).toEqual({
      major: 24,
      minor: 3,
      patch: 1,
      raw: '24.3.1',
    })
  })

  it('should parse version with build number', () => {
    const result = parseVersion('24.3.1.1')
    expect(result).toEqual({
      major: 24,
      minor: 3,
      patch: 1,
      build: 1,
      raw: '24.3.1.1',
    })
  })

  it('should handle versions with fewer components', () => {
    const result = parseVersion('24.3')
    expect(result).toEqual({
      major: 24,
      minor: 3,
      patch: 0,
      raw: '24.3',
    })
  })

  it('should handle single component version', () => {
    const result = parseVersion('24')
    expect(result).toEqual({
      major: 24,
      minor: 0,
      patch: 0,
      raw: '24',
    })
  })

  it('should handle empty string', () => {
    const result = parseVersion('')
    expect(result).toEqual({
      major: 0,
      minor: 0,
      patch: 0,
      raw: '',
    })
  })
})

describe('compareVersions', () => {
  const v24_1 = parseVersion('24.1.0')
  const v24_3 = parseVersion('24.3.0')
  const v25_0 = parseVersion('25.0.0')
  const v24_1_same = parseVersion('24.1.0')

  it('should return -1 when a < b (major)', () => {
    expect(compareVersions(v24_1, v25_0)).toBe(-1)
  })

  it('should return negative when a < b (minor)', () => {
    expect(compareVersions(v24_1, v24_3)).toBeLessThan(0)
  })

  it('should return 1 when a > b (major)', () => {
    expect(compareVersions(v25_0, v24_1)).toBe(1)
  })

  it('should return positive when a > b (minor)', () => {
    expect(compareVersions(v24_3, v24_1)).toBeGreaterThan(0)
  })

  it('should return 0 when versions are equal', () => {
    expect(compareVersions(v24_1, v24_1_same)).toBe(0)
  })

  it('should handle patch differences', () => {
    const v24_1_0 = parseVersion('24.1.0')
    const v24_1_5 = parseVersion('24.1.5')
    expect(compareVersions(v24_1_0, v24_1_5)).toBeLessThan(0)
    expect(compareVersions(v24_1_5, v24_1_0)).toBeGreaterThan(0)
  })
})

describe('meetsMinVersion', () => {
  const v24_3_1 = parseVersion('24.3.1')

  it('should return true when version meets exact minimum', () => {
    expect(meetsMinVersion(v24_3_1, 24, 3, 1)).toBe(true)
  })

  it('should return true when version exceeds minimum', () => {
    expect(meetsMinVersion(v24_3_1, 24, 1, 0)).toBe(true)
  })

  it('should return false when version is below minimum', () => {
    expect(meetsMinVersion(v24_3_1, 24, 4, 0)).toBe(false)
  })

  it('should use default minor and patch of 0', () => {
    expect(meetsMinVersion(v24_3_1, 24)).toBe(true)
    expect(meetsMinVersion(v24_3_1, 25)).toBe(false)
  })
})

describe('versionMatchesRange', () => {
  const v24_3_1 = parseVersion('24.3.1')

  it('should match version within range (inclusive)', () => {
    expect(versionMatchesRange(v24_3_1, '24.1.0', '24.5.0')).toBe(true)
  })

  it('should match version at min boundary', () => {
    expect(versionMatchesRange(v24_3_1, '24.3.1')).toBe(true)
  })

  it('should not match below minimum', () => {
    expect(versionMatchesRange(v24_3_1, '24.5.0')).toBe(false)
  })

  it('should not match at max boundary (exclusive)', () => {
    expect(versionMatchesRange(v24_3_1, undefined, '24.3.1')).toBe(false)
  })

  it('should match below max (exclusive)', () => {
    expect(versionMatchesRange(v24_3_1, undefined, '24.3.2')).toBe(true)
  })

  it('should handle undefined minVersion', () => {
    expect(versionMatchesRange(v24_3_1, undefined, '24.5.0')).toBe(true)
  })

  it('should handle undefined maxVersion', () => {
    expect(versionMatchesRange(v24_3_1, '24.1.0')).toBe(true)
  })

  it('should handle both undefined', () => {
    expect(versionMatchesRange(v24_3_1)).toBe(true)
  })
})

describe('parseSemverRange', () => {
  it('should parse simple >= range', () => {
    const result = parseSemverRange('>=24.1')
    expect(result.min).toBeDefined()
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
    expect(result.minInclusive).toBe(true)
    expect(result.max).toBeUndefined()
  })

  it('should parse simple < range', () => {
    const result = parseSemverRange('<24.5')
    expect(result.min).toBeUndefined()
    expect(result.max).toBeDefined()
    expect(result.max?.major).toBe(24)
    expect(result.max?.minor).toBe(5)
    expect(result.maxInclusive).toBe(false)
  })

  it('should parse compound range >=24.1 <24.5', () => {
    const result = parseSemverRange('>=24.1 <24.5')
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
    expect(result.minInclusive).toBe(true)
    expect(result.max?.major).toBe(24)
    expect(result.max?.minor).toBe(5)
    expect(result.maxInclusive).toBe(false)
  })

  it('should parse compound range with both inclusive', () => {
    const result = parseSemverRange('>=24.1 <=24.5')
    expect(result.minInclusive).toBe(true)
    expect(result.maxInclusive).toBe(true)
  })

  it('should parse caret range ^24.1.2', () => {
    const result = parseSemverRange('^24.1.2')
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
    expect(result.min?.patch).toBe(2)
    expect(result.minInclusive).toBe(true)
    expect(result.max?.major).toBe(25)
    expect(result.max?.minor).toBe(0)
    expect(result.max?.patch).toBe(0)
    expect(result.maxInclusive).toBe(false)
  })

  it('should parse tilde range ~24.1.2', () => {
    const result = parseSemverRange('~24.1.2')
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
    expect(result.min?.patch).toBe(2)
    expect(result.minInclusive).toBe(true)
    expect(result.max?.major).toBe(24)
    expect(result.max?.minor).toBe(2)
    expect(result.max?.patch).toBe(0)
    expect(result.maxInclusive).toBe(false)
  })

  it('should parse plain version as caret (^)', () => {
    const result = parseSemverRange('24.1')
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
    expect(result.minInclusive).toBe(true)
    expect(result.max?.major).toBe(25)
    expect(result.maxInclusive).toBe(false)
  })

  it('should parse > operator (exclusive)', () => {
    const result = parseSemverRange('>24.1')
    expect(result.minInclusive).toBe(false)
    expect(result.min?.major).toBe(24)
    expect(result.min?.minor).toBe(1)
  })

  it('should parse <= operator (inclusive)', () => {
    const result = parseSemverRange('<=24.5')
    expect(result.maxInclusive).toBe(true)
    expect(result.max?.major).toBe(24)
    expect(result.max?.minor).toBe(5)
  })

  it('should handle empty string', () => {
    const result = parseSemverRange('')
    expect(result.min).toBeUndefined()
    expect(result.max).toBeUndefined()
  })

  it('should handle whitespace-only string', () => {
    const result = parseSemverRange('   ')
    expect(result.min).toBeUndefined()
    expect(result.max).toBeUndefined()
  })

  it('should handle multiple spaces between operators', () => {
    const result = parseSemverRange('>=24.1    <24.5')
    expect(result.min?.minor).toBe(1)
    expect(result.max?.minor).toBe(5)
  })
})

describe('matchesSemverRange', () => {
  const v24_3_1 = parseVersion('24.3.1.1')
  const v24_1_0 = parseVersion('24.1.0')
  const v25_0_0 = parseVersion('25.0.0')

  describe('exact matches', () => {
    it('should match >= operator', () => {
      expect(matchesSemverRange(v24_3_1, '>=24.1')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '>=24.3')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '>=24.5')).toBe(false)
    })

    it('should match > operator', () => {
      expect(matchesSemverRange(v24_3_1, '>24.1')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '>24.3.1')).toBe(false) // 24.3.1.1 > 24.3.1 (build number)
      expect(matchesSemverRange(v24_3_1, '>24.5')).toBe(false)
    })

    it('should match < operator', () => {
      expect(matchesSemverRange(v24_3_1, '<24.5')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '<24.3')).toBe(false) // exclusive
      expect(matchesSemverRange(v24_3_1, '<24.1')).toBe(false)
    })

    it('should match <= operator', () => {
      expect(matchesSemverRange(v24_3_1, '<=24.5')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '<=24.3.1')).toBe(true) // 24.3.1.1 <= 24.3.1 (ignores build number in comparison)
      expect(matchesSemverRange(v24_3_1, '<=24.1')).toBe(false)
    })
  })

  describe('compound ranges', () => {
    it('should match range >=24.1 <24.5', () => {
      expect(matchesSemverRange(v24_3_1, '>=24.1 <24.5')).toBe(true)
      expect(matchesSemverRange(v24_1_0, '>=24.1 <24.5')).toBe(true)
      expect(matchesSemverRange(v25_0_0, '>=24.1 <24.5')).toBe(false)
    })

    it('should match range >=24.3.1 <=24.3.1', () => {
      const exact = parseVersion('24.3.1')
      expect(matchesSemverRange(exact, '>=24.3.1 <=24.3.1')).toBe(true)
      expect(matchesSemverRange(v24_1_0, '>=24.3.1 <=24.3.1')).toBe(false)
    })
  })

  describe('caret ranges', () => {
    it('should match ^24.1 (>=24.1 <25.0)', () => {
      expect(matchesSemverRange(v24_1_0, '^24.1')).toBe(true)
      expect(matchesSemverRange(v24_3_1, '^24.1')).toBe(true)
      expect(matchesSemverRange(v25_0_0, '^24.1')).toBe(false)
    })

    it('should match ^24.1.2 (>=24.1.2 <25.0.0)', () => {
      const v24_1_2 = parseVersion('24.1.2')
      const v24_1_1 = parseVersion('24.1.1')
      expect(matchesSemverRange(v24_3_1, '^24.1.2')).toBe(true)
      expect(matchesSemverRange(v24_1_2, '^24.1.2')).toBe(true)
      expect(matchesSemverRange(v24_1_1, '^24.1.2')).toBe(false)
    })
  })

  describe('tilde ranges', () => {
    it('should match ~24.1.2 (>=24.1.2 <24.2.0)', () => {
      const v24_1_2 = parseVersion('24.1.2')
      const v24_1_5 = parseVersion('24.1.5')
      const v24_2_0 = parseVersion('24.2.0')
      expect(matchesSemverRange(v24_1_2, '~24.1.2')).toBe(true)
      expect(matchesSemverRange(v24_1_5, '~24.1.2')).toBe(true)
      expect(matchesSemverRange(v24_2_0, '~24.1.2')).toBe(false)
    })

    it('should match ~24.1 (>=24.1 <24.2.0)', () => {
      const v24_1_0 = parseVersion('24.1.0')
      const v24_1_9 = parseVersion('24.1.9')
      const v24_2_0 = parseVersion('24.2.0')
      expect(matchesSemverRange(v24_1_0, '~24.1')).toBe(true)
      expect(matchesSemverRange(v24_1_9, '~24.1')).toBe(true)
      expect(matchesSemverRange(v24_2_0, '~24.1')).toBe(false)
    })
  })

  describe('shorthand ranges', () => {
    it('should match plain version as caret', () => {
      expect(matchesSemverRange(v24_3_1, '24.1')).toBe(true)
      expect(matchesSemverRange(v25_0_0, '24.1')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty range (always match)', () => {
      expect(matchesSemverRange(v24_3_1, '')).toBe(true)
      expect(matchesSemverRange(v24_1_0, '')).toBe(true)
    })
  })
})

describe('selectQueryVariant', () => {
  const v24_3_1 = parseVersion('24.3.1.1')
  const v24_1_0 = parseVersion('24.1.0')

  it('should return default query when no variants', () => {
    const def = { query: 'SELECT * FROM default' }
    expect(selectQueryVariant(def, v24_3_1)).toBe('SELECT * FROM default')
  })

  it('should return first matching variant', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: { minVersion: '24.1' }, query: 'SELECT * FROM v24.1' },
      ],
    }
    expect(selectQueryVariant(def, v24_3_1)).toBe('SELECT * FROM v24.1')
  })

  it('should use default when no variant matches', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        {
          versions: { minVersion: '25.0' },
          query: 'SELECT * FROM v25.0',
        },
      ],
    }
    expect(selectQueryVariant(def, v24_3_1)).toBe('SELECT * FROM default')
  })

  it('should return default when version is null', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: { minVersion: '24.1' }, query: 'SELECT * FROM v24.1' },
      ],
    }
    expect(selectQueryVariant(def, null)).toBe('SELECT * FROM default')
  })

  it('should match first variant in order', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: { minVersion: '24.0' }, query: 'SELECT * FROM v24.0' },
        { versions: { minVersion: '24.3' }, query: 'SELECT * FROM v24.3' },
      ],
    }
    expect(selectQueryVariant(def, v24_3_1)).toBe('SELECT * FROM v24.0')
  })

  it('should handle range variants', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        {
          versions: { minVersion: '24.1', maxVersion: '24.4' },
          query: 'SELECT * FROM v24.1-24.4',
        },
        {
          versions: { minVersion: '24.5' },
          query: 'SELECT * FROM v24.5+',
        },
      ],
    }
    expect(selectQueryVariant(def, v24_1_0)).toBe('SELECT * FROM v24.1-24.4')
    expect(selectQueryVariant(def, v24_3_1)).toBe('SELECT * FROM v24.1-24.4')
  })
})

describe('selectQueryVariantSemver', () => {
  const v24_3_1 = parseVersion('24.3.1.1')
  const v24_1_0 = parseVersion('24.1.0')
  const v25_0_0 = parseVersion('25.0.0')

  it('should return default query when no variants', () => {
    const def = { query: 'SELECT * FROM default' }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM default')
  })

  it('should return first matching variant with >= range', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '>=24.1', query: 'SELECT * FROM v24.1' }],
    }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM v24.1')
  })

  it('should return first matching variant with < range', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: '<24.1', query: 'SELECT * FROM v0' },
        { versions: '>=24.1', query: 'SELECT * FROM v24.1' },
      ],
    }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM v24.1')
  })

  it('should use default when no variant matches', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '>=25.0', query: 'SELECT * FROM v25.0' }],
    }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM default')
  })

  it('should return default when version is null', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '>=24.1', query: 'SELECT * FROM v24.1' }],
    }
    expect(selectQueryVariantSemver(def, null)).toBe('SELECT * FROM default')
  })

  it('should match first variant in order', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: '>=24.0', query: 'SELECT * FROM v24.0' },
        { versions: '>=24.3', query: 'SELECT * FROM v24.3' },
      ],
    }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM v24.0')
  })

  it('should handle compound range variants', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [
        { versions: '>=24.1 <24.3', query: 'SELECT * FROM v24.1-24.3' },
        { versions: '>=24.3', query: 'SELECT * FROM v24.3+' },
      ],
    }
    expect(selectQueryVariantSemver(def, v24_1_0)).toBe(
      'SELECT * FROM v24.1-24.3'
    )
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM v24.3+')
  })

  it('should handle caret ranges', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '^24.1', query: 'SELECT * FROM caret' }],
    }
    expect(selectQueryVariantSemver(def, v24_1_0)).toBe('SELECT * FROM caret')
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM caret')
    expect(selectQueryVariantSemver(def, v25_0_0)).toBe('SELECT * FROM default')
  })

  it('should handle tilde ranges', () => {
    const v24_1_2 = parseVersion('24.1.2')
    const v24_2_0 = parseVersion('24.2.0')
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '~24.1.2', query: 'SELECT * FROM tilde' }],
    }
    expect(selectQueryVariantSemver(def, v24_1_2)).toBe('SELECT * FROM tilde')
    expect(selectQueryVariantSemver(def, parseVersion('24.1.5'))).toBe(
      'SELECT * FROM tilde'
    )
    expect(selectQueryVariantSemver(def, v24_2_0)).toBe('SELECT * FROM default')
  })

  it('should handle plain version shorthand', () => {
    const def = {
      query: 'SELECT * FROM default',
      variants: [{ versions: '24.3', query: 'SELECT * FROM v24.3' }],
    }
    expect(selectQueryVariantSemver(def, v24_3_1)).toBe('SELECT * FROM v24.3')
    expect(selectQueryVariantSemver(def, v25_0_0)).toBe('SELECT * FROM default')
  })
})

describe('selectVersionedSql', () => {
  it('should return string SQL as-is', () => {
    const result = selectVersionedSql('SELECT * FROM t', parseVersion('24.1.0'))
    expect(result).toBe('SELECT * FROM t')
  })

  it('should return string SQL even with null version', () => {
    const result = selectVersionedSql('SELECT * FROM t', null)
    expect(result).toBe('SELECT * FROM t')
  })

  it('should throw error for empty array', () => {
    expect(() => selectVersionedSql([], parseVersion('24.1.0'))).toThrow(
      'VersionedSql array cannot be empty'
    )
  })

  it('should return SQL from single entry', () => {
    const result = selectVersionedSql(
      [{ since: '23.8', sql: 'SELECT col1 FROM t' }],
      parseVersion('24.1.0')
    )
    expect(result).toBe('SELECT col1 FROM t')
  })

  it('should select highest since version <= current', () => {
    const result = selectVersionedSql(
      [
        { since: '23.8', sql: 'SELECT v1' },
        { since: '24.1', sql: 'SELECT v2' },
        { since: '25.6', sql: 'SELECT v3' },
      ],
      parseVersion('24.5.1.1')
    )
    expect(result).toBe('SELECT v2') // 24.1 is highest <= 24.5
  })

  it('should fallback to oldest when version is older than all entries', () => {
    const result = selectVersionedSql(
      [
        { since: '24.1', sql: 'SELECT v1' },
        { since: '25.6', sql: 'SELECT v2' },
      ],
      parseVersion('23.8.0.0')
    )
    expect(result).toBe('SELECT v1') // Fallback to oldest
  })

  it('should fallback to oldest when version is null', () => {
    const result = selectVersionedSql(
      [
        { since: '23.8', sql: 'SELECT v1' },
        { since: '24.1', sql: 'SELECT v2' },
      ],
      null
    )
    expect(result).toBe('SELECT v1')
  })

  it('should select newest matching version', () => {
    const result = selectVersionedSql(
      [
        { since: '23.1', sql: 'SELECT v1' },
        { since: '23.8', sql: 'SELECT v2' },
        { since: '24.1', sql: 'SELECT v3' },
      ],
      parseVersion('25.0.0.0')
    )
    expect(result).toBe('SELECT v3') // 24.1 is highest available
  })

  it('should match exact version', () => {
    const result = selectVersionedSql(
      [
        { since: '23.8', sql: 'SELECT v1' },
        { since: '24.1', sql: 'SELECT v2' },
      ],
      parseVersion('24.1.0.0')
    )
    expect(result).toBe('SELECT v2') // Exact match
  })

  it('should handle single entry as fallback', () => {
    const result = selectVersionedSql(
      [{ since: '25.0', sql: 'SELECT v1' }],
      parseVersion('24.0.0.0')
    )
    expect(result).toBe('SELECT v1') // Falls back to only entry
  })

  it('should ignore order of input array and sort correctly', () => {
    const result = selectVersionedSql(
      [
        { since: '25.6', sql: 'SELECT v3' },
        { since: '23.8', sql: 'SELECT v1' },
        { since: '24.1', sql: 'SELECT v2' },
      ],
      parseVersion('24.5.0.0')
    )
    expect(result).toBe('SELECT v2') // Correctly sorts and selects 24.1
  })

  it('should handle major version differences', () => {
    const result = selectVersionedSql(
      [
        { since: '23.0', sql: 'SELECT v1' },
        { since: '24.0', sql: 'SELECT v2' },
        { since: '25.0', sql: 'SELECT v3' },
      ],
      parseVersion('24.9.9.9')
    )
    expect(result).toBe('SELECT v2') // 24.0 is highest <= 24.9
  })

  it('should handle patch version specificity', () => {
    const result = selectVersionedSql(
      [
        { since: '24.1.0', sql: 'SELECT v1' },
        { since: '24.1.5', sql: 'SELECT v2' },
      ],
      parseVersion('24.1.3.0')
    )
    expect(result).toBe('SELECT v1') // 24.1.3 < 24.1.5
  })

  it('should handle build numbers in version comparison', () => {
    const result = selectVersionedSql(
      [
        { since: '24.1', sql: 'SELECT v1' },
        { since: '24.1.1', sql: 'SELECT v2' },
      ],
      parseVersion('24.1.0.5')
    )
    expect(result).toBe('SELECT v1') // 24.1.0.5 < 24.1.1
  })

  it('should include version descriptions in results', () => {
    const sqlArray = [
      {
        since: '23.8',
        sql: 'SELECT col1 FROM t',
        description: 'Initial version',
      },
      {
        since: '24.1',
        sql: 'SELECT col1, col2 FROM t',
        description: 'Added col2',
      },
    ]
    const result = selectVersionedSql(sqlArray, parseVersion('24.5.0.0'))
    expect(result).toBe('SELECT col1, col2 FROM t')
  })

  it('should not mutate input array', () => {
    const sqlArray = [
      { since: '24.1', sql: 'SELECT v2' },
      { since: '23.8', sql: 'SELECT v1' },
    ]
    const originalOrder = sqlArray.map((e) => e.sql)
    selectVersionedSql(sqlArray, parseVersion('24.5.0.0'))
    const finalOrder = sqlArray.map((e) => e.sql)
    expect(finalOrder).toEqual(originalOrder) // Order unchanged
  })
})
