/**
 * Unit tests for server-version helpers.
 *
 * Tests the string-based wrappers (parseVersion, compareVersions) directly.
 * meetsMinVersion is tested via mock.module since it calls getClickHouseVersion.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

// ---------------------------------------------------------------------------
// parseVersion and compareVersions — pure functions, no mocking needed
// ---------------------------------------------------------------------------

const { parseVersion, compareVersions } = await import(
  new URL('../server-version.ts?test=server-version', import.meta.url).href
)

describe('parseVersion', () => {
  it('parses a 4-part CH version string', () => {
    const v = parseVersion('24.3.1.1')
    expect(v.major).toBe(24)
    expect(v.minor).toBe(3)
    expect(v.patch).toBe(1)
    expect(v.raw).toBe('24.3.1.1')
  })

  it('parses a 2-part version string', () => {
    const v = parseVersion('26.6')
    expect(v.major).toBe(26)
    expect(v.minor).toBe(6)
    expect(v.patch).toBe(0)
  })

  it('parses a 3-part version string', () => {
    const v = parseVersion('24.8.3')
    expect(v.major).toBe(24)
    expect(v.minor).toBe(8)
    expect(v.patch).toBe(3)
  })

  it('returns zeroes for an empty string', () => {
    const v = parseVersion('')
    expect(v.major).toBe(0)
    expect(v.minor).toBe(0)
    expect(v.patch).toBe(0)
  })
})

describe('compareVersions', () => {
  it('returns -1 when first is older', () => {
    expect(compareVersions('24.1.0.0', '24.3.0.0')).toBe(-1)
  })

  it('returns 0 when versions are equal', () => {
    expect(compareVersions('26.6.1.0', '26.6.1.0')).toBe(0)
  })

  it('returns 1 when first is newer', () => {
    expect(compareVersions('26.6.0.0', '24.3.0.0')).toBe(1)
  })

  it('compares across major versions', () => {
    expect(compareVersions('26.1.0.0', '25.12.0.0')).toBe(1)
    expect(compareVersions('25.12.0.0', '26.1.0.0')).toBe(-1)
  })

  it('compares minor versions with same major', () => {
    expect(compareVersions('26.6.0.0', '26.5.0.0')).toBe(1)
    expect(compareVersions('26.5.0.0', '26.6.0.0')).toBe(-1)
  })

  it('compares 2-part shorthand against 4-part full version', () => {
    expect(compareVersions('26.6', '26.5.1.0')).toBe(1)
    expect(compareVersions('26.5', '26.6.0.0')).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// meetsMinVersion — requires mocking getClickHouseVersion
// ---------------------------------------------------------------------------

type MockVersion = {
  major: number
  minor: number
  patch: number
  build: number
  raw: string
} | null

const mockGetClickHouseVersion = mock(
  async (_hostId: number): Promise<MockVersion> => ({
    major: 26,
    minor: 6,
    patch: 1,
    build: 0,
    raw: '26.6.1.0',
  })
)

mock.module('@chm/clickhouse-client/clickhouse-version', () => ({
  getClickHouseVersion: mockGetClickHouseVersion,
  parseVersion: (s: string) => {
    const parts = s.split('.')
    return {
      major: parseInt(parts[0] || '0', 10),
      minor: parseInt(parts[1] || '0', 10),
      patch: parseInt(parts[2] || '0', 10),
      build: parts[3] ? parseInt(parts[3], 10) : undefined,
      raw: s,
    }
  },
  compareVersions: (
    a: { major: number; minor: number; patch: number },
    b: { major: number; minor: number; patch: number }
  ) => {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    if (a.patch !== b.patch) return a.patch - b.patch
    return 0
  },
  meetsMinVersion: (
    v: { major: number; minor: number; patch: number },
    minMajor: number,
    minMinor = 0,
    minPatch = 0
  ) => {
    if (v.major !== minMajor) return v.major > minMajor
    if (v.minor !== minMinor) return v.minor > minMinor
    return v.patch >= minPatch
  },
}))

const { meetsMinVersion } = await import(
  new URL('../server-version.ts?test=meets', import.meta.url).href
)

describe('meetsMinVersion', () => {
  beforeEach(() => {
    mockGetClickHouseVersion.mockResolvedValue({
      major: 26,
      minor: 6,
      patch: 1,
      build: 0,
      raw: '26.6.1.0',
    })
  })

  afterEach(() => {
    mockGetClickHouseVersion.mockReset()
  })

  it('returns true when host version meets minimum', async () => {
    const result = await meetsMinVersion(0, '26.6')
    expect(result).toBe(true)
  })

  it('returns true when host version exceeds minimum', async () => {
    const result = await meetsMinVersion(0, '24.8')
    expect(result).toBe(true)
  })

  it('returns false when host version is below minimum', async () => {
    mockGetClickHouseVersion.mockResolvedValue({
      major: 24,
      minor: 8,
      patch: 1,
      build: 0,
      raw: '24.8.1.0',
    })
    const result = await meetsMinVersion(0, '26.6')
    expect(result).toBe(false)
  })

  it('returns false when version cannot be determined', async () => {
    mockGetClickHouseVersion.mockResolvedValue(null)
    const result = await meetsMinVersion(0, '26.6')
    expect(result).toBe(false)
  })
})
